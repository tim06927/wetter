// @ts-check

const DATA_FILE = './data_some_cleaning.csv';
const OZONE_FILE = './ozon.txt';
const GEIGER_FILE = './geiger.txt';

const columns = {
  uptime: 'Uptime [s]',
  time: 'GNSS: UTC date time (ISO 8601)',
  fix: 'GNSS: Fix type (0=no fix, others=fix)',
  lat: 'GNSS: Latitude [degrees]',
  lon: 'GNSS: Longitude [degrees]',
  altitude: 'GNSS: Altitude [m] (above Mean Sea Level)',
  speed: 'GNSS: Ground speed [km/h]',
  temperature: 'Temperature: Ext MS8607 1 [degC]',
  pressure: 'Pressure: Ext MS8607 [hPa]',
  humidity: 'Humidity: Ext MS8607 [%]',
  uva: 'Light Intensity: UVA index []',
};

const metricConfig = {
  altitude: { label: 'Altitude', unit: 'm', column: 'altitude', color: '#0f6b6e', clampMin: 0 },
  temperature: { label: 'Temperature', unit: 'C', column: 'temperature', color: '#c5452f' },
  pressure: { label: 'Pressure', unit: 'hPa', column: 'pressure', color: '#375a9e' },
  humidity: { label: 'Humidity', unit: '%', column: 'humidity', color: '#5c7a25', clampMin: 0 },
  speed: { label: 'Ground speed', unit: 'km/h', column: 'speed', color: '#7a4c9c', clampMin: 0 },
  uva: { label: 'UVA index', unit: '', column: 'uva', color: '#b8870a', clampMin: 0 },
};

const appState = {
  flight: [],
  ozone: [],
  geiger: [],
  metric: 'altitude',
  density: 360,
};

const statusEl = document.querySelector('#data-status');
const metricSelect = document.querySelector('#metric-select');
const densitySlider = document.querySelector('#density-slider');
const chartTitle = document.querySelector('#chart-title');
const chartNote = document.querySelector('#chart-note');
const selectedPoint = document.querySelector('#selected-point');

init().catch((error) => {
  console.error(error);
  setStatus(`Could not load data: ${error.message}`);
});

async function init() {
  const [flightText, ozoneText, geigerText] = await Promise.all([
    fetchText(DATA_FILE),
    fetchText(OZONE_FILE),
    fetchText(GEIGER_FILE),
  ]);

  appState.flight = parseFlightCsv(flightText);
  appState.ozone = parseSimpleSensorFile(ozoneText, 'ppb');
  appState.geiger = parseSimpleSensorFile(geigerText, 'clicks');

  if (appState.flight.length === 0) {
    throw new Error('No usable flight rows found');
  }

  renderMetrics();
  renderTable();
  renderAll();
  wireControls();

  setStatus(`${appState.flight.length.toLocaleString()} valid flight records loaded`);
}

async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.text();
}

function parseFlightCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headerIndex = lines.findIndex((line) => line.startsWith('Uptime [s];'));
  if (headerIndex === -1) {
    throw new Error('Could not find the telemetry header row');
  }

  const headers = lines[headerIndex].split(';');
  return lines
    .slice(headerIndex + 1)
    .filter((line) => !line.startsWith('---'))
    .map((line) => parseFlightRow(headers, line))
    .filter((row) => row && Number.isFinite(row.lat) && Number.isFinite(row.lon));
}

function parseFlightRow(headers, line) {
  const values = line.split(';');
  if (values.length < headers.length) return null;

  const record = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  const time = new Date(record[columns.time]);
  const row = {
    uptime: numeric(record[columns.uptime]),
    time,
    fix: numeric(record[columns.fix]),
    lat: numeric(record[columns.lat]),
    lon: numeric(record[columns.lon]),
    altitude: numeric(record[columns.altitude]),
    speed: numeric(record[columns.speed]),
    temperature: numeric(record[columns.temperature]),
    pressure: numeric(record[columns.pressure]),
    humidity: numeric(record[columns.humidity]),
    uva: numeric(record[columns.uva]),
  };

  if (!Number.isFinite(row.uptime) || Number.isNaN(time.getTime())) return null;
  return row;
}

function parseSimpleSensorFile(text, unit) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d/.test(line))
    .map((line) => {
      const [ms, value] = line.split(',');
      return { ms: numeric(ms), value: numeric(value), unit };
    })
    .filter((row) => Number.isFinite(row.ms) && Number.isFinite(row.value));
}

function numeric(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function wireControls() {
  if (metricSelect instanceof HTMLSelectElement) {
    metricSelect.addEventListener('change', () => {
      appState.metric = metricSelect.value;
      renderAll();
    });
  }

  if (densitySlider instanceof HTMLInputElement) {
    densitySlider.addEventListener('input', () => {
      appState.density = Number.parseInt(densitySlider.value, 10);
      renderAll();
    });
  }

  document.querySelectorAll('.task-button').forEach((button) => {
    button.addEventListener('click', () => {
      if (!(button instanceof HTMLButtonElement)) return;
      const messages = {
        apogee: 'Task: Show the exact apogee time and explain why pressure is lowest there.',
        descent: 'Task: Compute vertical speed between readings and chart descent rate.',
        ozone: 'Task: Align ozone sensor milliseconds with flight time and compare by altitude.',
        geiger: 'Task: Convert Geiger clicks into a rate and test whether it rises with altitude.',
      };
      setSelected(messages[button.dataset.task] ?? 'Choose a task and make a small pull request.');
    });
  });

  window.addEventListener('resize', () => renderAll());
}

function renderAll() {
  renderMainChart();
  renderMap();
}

function renderMetrics() {
  const metricsEl = document.querySelector('#metrics');
  const template = document.querySelector('#metric-template');
  if (!(metricsEl instanceof HTMLElement) || !(template instanceof HTMLTemplateElement)) return;

  metricsEl.replaceChildren();
  const summary = summarizeFlight(appState.flight);
  const ozoneMax = maxBy(appState.ozone, (row) => row.value);
  const geigerTotal = appState.geiger.reduce((sum, row) => sum + row.value, 0);

  [
    ['Max altitude', formatNumber(summary.maxAltitude.altitude, 0, 'm'), formatTime(summary.maxAltitude.time)],
    ['Flight duration', formatDuration(summary.durationSeconds), `${formatTime(summary.start.time)} to ${formatTime(summary.end.time)}`],
    ['Lowest temperature', formatNumber(summary.minTemperature.temperature, 1, 'C'), formatTime(summary.minTemperature.time)],
    ['Distance', formatNumber(summary.distanceKm, 1, 'km'), 'Projected from GNSS points'],
    ['Peak ozone', ozoneMax ? formatNumber(ozoneMax.value, 0, 'ppb') : 'n/a', `${appState.ozone.length.toLocaleString()} ozone readings`],
    ['Geiger clicks', geigerTotal.toLocaleString(), `${appState.geiger.length.toLocaleString()} radiation readings`],
  ].forEach(([label, value, detail]) => {
    const item = template.content.firstElementChild?.cloneNode(true);
    if (!(item instanceof HTMLElement)) return;
    item.querySelector('.metric-label').textContent = label;
    item.querySelector('.metric-value').textContent = value;
    item.querySelector('.metric-detail').textContent = detail;
    metricsEl.append(item);
  });
}

function summarizeFlight(rows) {
  const start = rows[0];
  const end = rows[rows.length - 1];
  return {
    start,
    end,
    maxAltitude: maxBy(rows, (row) => row.altitude) ?? start,
    minTemperature: minBy(rows, (row) => row.temperature) ?? start,
    durationSeconds: (end.time.getTime() - start.time.getTime()) / 1000,
    distanceKm: pathDistanceKm(rows),
  };
}

function renderMainChart() {
  const svg = document.querySelector('#main-chart');
  if (!(svg instanceof SVGSVGElement)) return;

  const config = metricConfig[appState.metric] ?? metricConfig.altitude;
  const rows = sample(appState.flight, appState.density);
  const values = rows.map((row) => row[config.column]).filter(Number.isFinite);
  const xRange = [rows[0].uptime, rows[rows.length - 1].uptime];
  const yRange = extent(values, { clampMin: config.clampMin });

  if (chartTitle) chartTitle.textContent = `${config.label} over flight time`;
  if (chartNote) chartNote.textContent = `${rows.length.toLocaleString()} sampled points from the cleaned telemetry CSV.`;

  const width = svg.clientWidth || 820;
  const height = svg.clientHeight || 390;
  const pad = { top: 26, right: 28, bottom: 42, left: 58 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.replaceChildren();

  const group = svgEl('g', { transform: `translate(${pad.left} ${pad.top})` });
  svg.append(group);

  drawGrid(group, plotWidth, plotHeight, yRange, config.unit);

  const points = rows
    .filter((row) => Number.isFinite(row[config.column]))
    .map((row) => {
      const x = scale(row.uptime, xRange, [0, plotWidth]);
      const y = scale(row[config.column], yRange, [plotHeight, 0]);
      return { row, x, y };
    });

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  group.append(svgEl('path', {
    d: path,
    class: 'signal-line',
    stroke: config.color,
  }));

  points.forEach((point, index) => {
    if (index % Math.ceil(points.length / 90) !== 0 && index !== points.length - 1) return;
    const circle = svgEl('circle', {
      cx: point.x,
      cy: point.y,
      r: 3.1,
      class: 'signal-point',
      fill: config.color,
    });
    circle.addEventListener('mouseenter', () => {
      setSelected(`${formatTime(point.row.time)} | ${config.label}: ${formatNumber(point.row[config.column], 1, config.unit)} | Altitude: ${formatNumber(point.row.altitude, 0, 'm')}`);
    });
    group.append(circle);
  });

  drawAxisLabel(svg, pad.left + plotWidth / 2, height - 8, 'Flight time');
}

function renderMap() {
  const svg = document.querySelector('#map-chart');
  if (!(svg instanceof SVGSVGElement)) return;

  const rows = sample(appState.flight, appState.density).filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lon));
  const width = svg.clientWidth || 820;
  const height = svg.clientHeight || 390;
  const pad = 34;
  const latRange = extent(rows.map((row) => row.lat));
  const lonRange = extent(rows.map((row) => row.lon));
  const altitudeRange = extent(rows.map((row) => row.altitude));

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.replaceChildren();

  const background = svgEl('rect', {
    x: 0,
    y: 0,
    width,
    height,
    rx: 6,
    class: 'map-background',
  });
  svg.append(background);

  const points = rows.map((row) => ({
    row,
    x: scale(row.lon, lonRange, [pad, width - pad]),
    y: scale(row.lat, latRange, [height - pad, pad]),
  }));

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  svg.append(svgEl('path', { d: path, class: 'track-line' }));

  points.forEach((point, index) => {
    if (index % Math.ceil(points.length / 140) !== 0 && index !== points.length - 1) return;
    const ratio = (point.row.altitude - altitudeRange[0]) / Math.max(1, altitudeRange[1] - altitudeRange[0]);
    const circle = svgEl('circle', {
      cx: point.x,
      cy: point.y,
      r: 2.5 + ratio * 4,
      class: 'track-point',
    });
    circle.addEventListener('mouseenter', () => {
      setSelected(`${formatTime(point.row.time)} | ${point.row.lat.toFixed(5)}, ${point.row.lon.toFixed(5)} | ${formatNumber(point.row.altitude, 0, 'm')}`);
    });
    svg.append(circle);
  });

  const start = points[0];
  const finish = points[points.length - 1];
  if (start) drawMapMarker(svg, start.x, start.y, 'Launch');
  if (finish) drawMapMarker(svg, finish.x, finish.y, 'Landing');
}

function drawGrid(group, width, height, yRange, unit) {
  const ticks = 5;
  for (let index = 0; index <= ticks; index += 1) {
    const y = (height / ticks) * index;
    const value = scale(y, [height, 0], yRange);
    group.append(svgEl('line', { x1: 0, x2: width, y1: y, y2: y, class: 'grid-line' }));
    const label = svgEl('text', { x: -12, y: y + 4, class: 'axis-label', 'text-anchor': 'end' });
    label.textContent = formatNumber(value, 0, unit);
    group.append(label);
  }
}

function drawAxisLabel(svg, x, y, text) {
  const label = svgEl('text', { x, y, class: 'axis-title', 'text-anchor': 'middle' });
  label.textContent = text;
  svg.append(label);
}

function drawMapMarker(svg, x, y, text) {
  svg.append(svgEl('circle', { cx: x, cy: y, r: 7, class: 'map-marker' }));
  const label = svgEl('text', { x: x + 11, y: y + 4, class: 'map-label' });
  label.textContent = text;
  svg.append(label);
}

function renderTable() {
  const body = document.querySelector('#data-preview');
  if (!(body instanceof HTMLTableSectionElement)) return;

  body.replaceChildren();
  appState.flight.slice(0, 12).forEach((row) => {
    const tr = document.createElement('tr');
    [
      formatTime(row.time),
      row.lat.toFixed(5),
      row.lon.toFixed(5),
      formatNumber(row.altitude, 1, 'm'),
      formatNumber(row.temperature, 1, 'C'),
      formatNumber(row.pressure, 1, 'hPa'),
    ].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    });
    body.append(tr);
  });
}

function sample(rows, target) {
  const step = Math.max(1, Math.floor(rows.length / target));
  return rows.filter((_, index) => index % step === 0);
}

function extent(values, options = {}) {
  const finite = values.filter(Number.isFinite);
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const padding = Math.max((max - min) * 0.08, 1);
  const lower = options.clampMin === undefined ? min - padding : Math.max(options.clampMin, min - padding);
  return [lower, max + padding];
}

function scale(value, from, to) {
  const span = from[1] - from[0];
  const ratio = Math.abs(span) < 1e-9 ? 0 : (value - from[0]) / span;
  return to[0] + ratio * (to[1] - to[0]);
}

function maxBy(items, accessor) {
  return items.reduce((best, item) => {
    if (!best || accessor(item) > accessor(best)) return item;
    return best;
  }, null);
}

function minBy(items, accessor) {
  return items.reduce((best, item) => {
    if (!best || accessor(item) < accessor(best)) return item;
    return best;
  }, null);
}

function pathDistanceKm(rows) {
  let total = 0;
  for (let index = 1; index < rows.length; index += 1) {
    total += haversineKm(rows[index - 1], rows[index]);
  }
  return total;
}

function haversineKm(a, b) {
  const earthKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(h));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function formatNumber(value, digits = 0, unit = '') {
  if (!Number.isFinite(value)) return 'n/a';
  const formatted = new Intl.NumberFormat('en', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} h ${minutes} min`;
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  }).format(date);
}

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function setSelected(message) {
  if (selectedPoint) selectedPoint.textContent = message;
}

function svgEl(name, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
  return element;
}

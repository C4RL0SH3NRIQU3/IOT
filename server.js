const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, () =>
  console.log(`Servidor em http://localhost:${PORT}`)
);

const wss = new WebSocket.Server({ server });

// Estado simulado
let state = {
  temperature: 25.0,
  soil: 50,            
  irrigationOn: false
};

// Limites solicitados
const SOIL_TURN_ON  = 50;   // liga quando <= 50
const SOIL_TURN_OFF = 51;   // desliga quando >= 51

// Limites da simulação visual
const SOIL_MIN = 45;
const SOIL_MAX = 55;

function broadcast(data) {
  wss.clients.forEach(c => {
    if (c.readyState === 1) {
      c.send(JSON.stringify(data));
    }
  });
}

setInterval(() => {
  // Temperatura simulada
  state.temperature = +(state.temperature + (Math.random() - 0.5)).toFixed(1);

  // Variação leve da umidade
  const variation = Math.round((Math.random() - 0.5) * 2); // variação +-2
  state.soil += variation;

  // Mantém dentro dos limites desejados
  if (state.soil < SOIL_MIN) state.soil = SOIL_MIN;
  if (state.soil > SOIL_MAX) state.soil = SOIL_MAX;

  // ---- AUTOMAÇÃO SUPER RÁPIDA ----
  if (state.soil <= SOIL_TURN_ON && !state.irrigationOn) {
    state.irrigationOn = true;
    console.log(`💧 Irrigação LIGADA (umidade = ${state.soil}%)`);
  }

  if (state.soil >= SOIL_TURN_OFF && state.irrigationOn) {
    state.irrigationOn = false;
    console.log(`🛑 Irrigação DESLIGADA (umidade = ${state.soil}%)`);
  }
  // --------------------------------

  broadcast({ type: 'sensors', data: state });

}, 2000);  // atualiza a cada 2 segundos

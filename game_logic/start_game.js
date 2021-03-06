var game = require('./game');
var request = require('request');
var testBot = require('./test_bot');
var utils = require('./utils');
var models = require('../models');
var Turn = models.Turn;

var turns = [];

module.exports = function startGame(botUrls, gameStore, cb, sendTurn) {
  var newState = game.create(20, 20, 200);
  var gameState = utils.buildGameState(newState);
  turns = [];
  var playerOptions = {
    p1Options: {
      url: botUrls[0],
      method: 'POST',
      form: {},
      timeout: 5000,
    },
    p2Options: {
      url: botUrls[1],
      method: 'POST',
      form: {},
      timeout: 5000,
    },
  };

  gameStore.playerOptions = playerOptions;

  gameStore.save().then(function(savedGame) {
    nextTurn(savedGame, gameState, cb, sendTurn);
  });
};

function endGameForError(game, playerName, playerError, playerWinner, err, cb) {
  utils.log('PLAYER ' + playerName + ' ERROR: ' + err);
  game.end = playerError + ' bot error';
  game.winner = playerWinner;
  game.finished = true;
  game.finishedAt = Date.now();
  gameStarted = false;
  ready = 0;
  saveGameAndTurns(game, cb);
}

function nextTurn(gameStore, gameState, cb, sendTurn) {
  var p1Moves = null;
  var p2Moves = null;
  var { p1Options, p2Options } = gameStore.playerOptions;

  p1Options.form.data = utils.stringifyGameState('r', gameState, gameStore.id);
  p2Options.form.data = utils.stringifyGameState('b', gameState, gameStore.id);

  function playerResponse(body) {
    if (p1Moves && p2Moves) {
      evalMoves(gameStore, gameState, p1Moves, p2Moves, cb, sendTurn);
    }
  }

  if (p1Options.url === 'nodebot') {
    p1Moves = testBot(p1Options.form.data);
    playerResponse();
  } else {
    request(p1Options, function(err, res, body) {
      if (!err) {
        utils.log('Player 1 received data: ' + body);
        p1Moves = utils.tryParse(body);
        playerResponse();
      } else {
        endGameForError(gameStore, 'ONE', gameStore.p1, gameStore.p2, err, cb);
      }
    });
  }

  if (p2Options.url === 'nodebot') {
    p2Moves = testBot(p2Options.form.data);
    playerResponse();
  } else {
    request(p2Options, function(err, res, body) {
      if (!err) {
        utils.log('Player 2 received data: ' + body);
        p2Moves = utils.tryParse(body);
        playerResponse();
      } else {
        endGameForError(gameStore, 'TWO', gameStore.p2, gameStore.p1, err, cb);
      }
    });
  }
}

function detectGameComplete(gameStore, completeState, cb, sendTurn) {
  if (completeState.winner) {
    utils.log('GAME ENDED');
    if (completeState.winner) {
      if (completeState.winner === 'r') {
        utils.log('Client 1 wins');
        gameStore.winner = gameStore.p1;
      } else if (completeState.winner === 'b') {
        utils.log('Client 2 wins');
        gameStore.winner = gameStore.p2;
      }
      gameStore.finished = true;
      gameStore.finishedAt = Date.now();
    }
    gameStarted = false;
    ready = 0;
    saveGameAndTurns(gameStore, cb);
  } else {
    nextTurn(gameStore, completeState, cb, sendTurn);
  }
}

function evalMoves(gameStore, gameState, p1Moves, p2Moves, cb, sendTurn) {
  var newGameState = utils.buildGameState(game.doTurn(gameState, p1Moves, p2Moves));
  newGameState.GameId = gameStore.id;
  sendTurn(newGameState);
  turns.push(utils.copyObj(newGameState));
  detectGameComplete(gameStore, newGameState, cb, sendTurn);
}

function saveGameAndTurns(game, cb) {
  game.save().then(function(savedStore) {
    Turn.bulkCreate(turns).then(function() {
      if (cb) {
        cb();
      }
    });
  });
}

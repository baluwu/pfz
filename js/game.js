var game;
var cursors;
var cards;
var activeCard = null, passiveCard = null;
var chain = {};
var oldPos = null;

var CARD_WIDTH = 53, CARD_HEIGHT = 60, MIN_Y_MOVE_HEIGHT = 50;

window.onload = function() {
    game = new Phaser.Game(1280, 720);
    game.state.add("PlayGame", playGame)
    game.state.start("PlayGame");
}

var playGame = function(game) {}
playGame.prototype = {
  preload: function() {
    game.load.image('game_bk', 'assets/game_bk.jpg');
    for (var i = 1; i <= 10; i++) {
      for (var j = 1; j <= 2; j++) {
        var img = (j % 2 ? 'x' : 'd') + i;
        game.load.image(img, 'assets/cards/' + img + '.png');
      }
    }
  },

  _makeCards: function() {
    var _cards = [];
    for (var i = 1; i <= 10; i++) {
      for (var j = 1; j <= 8; j++) {
        _cards.push({
          id: (i - 1) * 8 + j - 1,
          name: (j % 2 ? 'x' : 'd') + i,
        });
      }
    }

    Phaser.ArrayUtils.shuffle(_cards);
    Phaser.ArrayUtils.shuffle(_cards);

    _cards = _cards.slice(0, 20);

    return sortCards(_cards);
  },

  _createCards: function() {
    /*加载字牌*/
    cards = game.add.group();
    cards.enableBody = true;
    
    var my_cards = this._makeCards();
    
    var scale = 0.5;
    var x = 10;
    var y = (game.height) - CARD_HEIGHT;

    /*给自己发20张牌*/
    for (var name in my_cards) {
      var agroup = my_cards[name]['els'];
      var g_y, chain_id = agroup[0].id;

      for (var i = agroup.length - 1; i >= 0; i--) {
        var a_card = agroup[i];
        g_y = game.height - CARD_HEIGHT - i * MIN_Y_MOVE_HEIGHT;
        var card = cards.create(x, g_y, a_card.name);
        card.scale.setTo(scale, scale); 

        //card.body.gravity.y = 1000;  
        game.physics.arcade.enable(card);
        //card.body.collideWorldBounds = true;
        card.inputEnabled = true;
        card.input.enableDrag();
        card.id = a_card.id;
        card.chain_id = chain_id;
        card.reserve_chain_id = chain_id
        card.chain_idx = i;

        card.events.onInputDown.add(onDragStart);
        card.events.onInputUp.add(onDragEnd);

        if (chain[chain_id]) {
          chain[chain_id].push(card);
        }
        else {
          chain[chain_id] = [card];
        }

        cards.bringToTop(card);
      }
      x += CARD_WIDTH;
    }
  },

  create: function() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.add.sprite(0, 0, 'game_bk');
    game.stage.backgroundColor = "#333";

    this._createCards();
    
    cursors = game.input.keyboard.createCursorKeys();
  },

  update: function () {
    game.physics.arcade.collide(activeCard, cards, function(left, right) {
      //if (passiveCard) return ;
      passiveCard = right;
      activeCard = left;
    }, null, this);
  }
};

function onDragStart(e) {
  activeCard = e;
  oldPos = { x: e.x, y: e.y };
  cards.bringToTop(e);
}

function onDragEnd(e) {
  
  if (passiveCard && activeCard) {
    /*修改链表id跟目标链表id一致*/
    var tochain = chain[passiveCard.chain_id];
    var fromchain = chain[activeCard.chain_id];
    var is_in_chain = inChain(activeCard, tochain);
    
    if (-1 == is_in_chain) {
      console.log('not in chain');
      /*当前链表的元素个数*/
      var len = tochain.length;
      /*当前加入链表的字牌索引*/
      activeCard.chain_idx = len;
      /*修改当前移动字牌的x坐标*/
      activeCard.x = passiveCard.x;
      /*修改当前移动字牌的y坐标*/
      activeCard.y = tochain[0].y - len * 45;
      /*当前字牌加入链表*/
      tochain.push(activeCard);
      /*当前字牌从原来链表移除*/
      removeFromChain(activeCard, fromchain);
      activeCard.chain_id = passiveCard.chain_id;
    }
    else {
      /*当前字牌从链表中分离*/
      if (Math.abs(passiveCard.x - activeCard.x) > CARD_WIDTH) {
        /*恢复当前元素的chain_id*/
        removeFromChain(activeCard, tochain, true);
      }
      /*当前字牌在组内移动*/
      else {
        /*修正被替换的字牌*/
        adjusctPassiveCard();
        if (Math.abs(passiveCard.y - activeCard.y) < (MIN_Y_MOVE_HEIGHT >> 1)) {
          swapChainCard(activeCard, passiveCard);
        }
      }
    }

    /*修正显示*/
    adjustView(fromchain, tochain);
    console.log(chain);
  }
  else if (activeCard && !passiveCard) {
    activeCard.y = oldPos.y;
  }
  
  activeCard = null;
  passiveCard = null;
}

function inChain(el, chain) {
  for (var i = 0; i < chain.length; i++) {
    if (el.id == chain[i].id) {
      return i;
    }
  }

  return -1;
}

function removeFromChain(el, achain, restore) {
  var idx = inChain(el, achain);
  achain.splice(idx, 1);

  if (restore) {
    el.chain_id = getFreeChainId(el);
    chain[el.chain_id].push(el);
  }
}

function getFreeChainId(el) {
  var old_chain_id = el.reserve_chain_id;
  
  if (chain[old_chain_id].length == 0) {
    return old_chain_id;
  }

  for (var k in chain) {
    if (chain[k].length == 0) {
        return k;
    }
  }
}

function adjustView(fromChain, toChain) {
  for (var i = fromChain.length - 1; i >= 0; i--) {
    var card = fromChain[i];
    var dx = oldPos.x, dy = game.height - MIN_Y_MOVE_HEIGHT * i - CARD_HEIGHT;
    console.log('adjust ' + card.key + ' to:' + dx + ',' + dy);
    card.x = dx;
    card.y = dy;
    card.chain_idx = i;
    cards.bringToTop(card);
  }

  if (fromChain != toChain) {
    for (var i = toChain.length - 1; i >= 0; i--) {
      var card = toChain[i];
      var dx = passiveCard.x, dy = game.height - MIN_Y_MOVE_HEIGHT * i - CARD_HEIGHT;
      card.x = dx;
      card.y = dy;
      card.chain_idx = i;
      cards.bringToTop(card);
    }
  }

  /*当前字牌所在组只有一张时 重置位置*/
  if (chain[activeCard.chain_id].length == 1) {
    activeCard.y = game.height - CARD_HEIGHT;
  }
}

function swapChainCard(lcard, rcard) {
  if (lcard == rcard) return;

  var t_chain_id = lcard.chain_id;
  var t_l_card_chain_idx = lcard.chain_idx;
  var t_r_card_chain_idx = rcard.chain_idx;

  chain[t_chain_id][t_l_card_chain_idx] = rcard;
  chain[t_chain_id][t_r_card_chain_idx] = lcard;
}

function adjusctPassiveCard() {
  var dy = Math.abs((game.height - CARD_HEIGHT) - activeCard.y);
  var max_idx = chain[activeCard.chain_id].length - 1;
  if (max_idx == 1) return;

  var idx = Math.round(dy / MIN_Y_MOVE_HEIGHT);
  idx = idx > max_idx ? max_idx : idx;

  //console.log(dy, MIN_Y_MOVE_HEIGHT, idx);
  passiveCard = chain[activeCard.chain_id][idx];
  //console.log('adjust PassiveCard to ' + passiveCard.key);
}




























var game;
var cursors;
var cards;
var activeCard = null, passiveCard = null;
var chain = {};

var CARD_WIDTH = 36, CARD_HEIGHT = 132;

window.onload = function() {
    game = new Phaser.Game(1024, 300);
    game.state.add("PlayGame", playGame)
    game.state.start("PlayGame");
}

var playGame = function(game) {}
playGame.prototype = {
  preload: function() {
    for (var i = 1; i <= 10; i++) {
      for (var j = 1; j <= 2; j++) {
        var img = (j % 2 ? 'x_' : 'd_') + i;
        game.load.image(img, 'assets/cards/' + img + '.jpg');
      }
    }
  },

  _makeCards: function() {
    var _cards = [];
    for (var i = 1; i <= 10; i++) {
      for (var j = 1; j <= 8; j++) {
        _cards.push({
          id: (i - 1) * 8 + j - 1,
          img: (j % 2 ? 'x_' : 'd_') + i
        });
      }
    }

    return _cards;
  },

  _createCards: function() {
    /*加载字牌*/
    cards = game.add.group();
    cards.enableBody = true;
    
    var my_cards = this._makeCards();
    Phaser.ArrayUtils.shuffle(my_cards);
    Phaser.ArrayUtils.shuffle(my_cards);

    var scale = 0.08;
    var x = 10;
    var y = (game.height) - 80;

    /*给自己发20张牌*/
    for (var i = 0; i < 3; i++) {
      var a_card = my_cards[i];
      var card = cards.create(x, y, a_card.img);
      card.scale.setTo(scale, scale); 

      //card.body.gravity.y = 1000;  
      game.physics.arcade.enable(card);
      card.body.collideWorldBounds = true;
      card.inputEnabled = true;
      card.input.enableDrag();
      card.id = a_card.id;
      card.chain_id = a_card.id;
      card.reserve_chain_id = a_card.id;
      card.chain_idx = 0;

      card.events.onInputDown.add(onDragStart);
      card.events.onInputUp.add(onDragEnd);
      x += CARD_WIDTH;

      chain[a_card.id] = [card];
    }
  },

  create: function() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = "#f1f1f1";

    this._createCards();
    
    cursors = game.input.keyboard.createCursorKeys();
  },

  update: function () {
    game.physics.arcade.collide(activeCard, cards, function(left, right) {
      if (passiveCard) return ;
      passiveCard = right;
      activeCard = left;
    }, null, this);
  }
};

function onDragStart(e) {
  activeCard = e;
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
      /*修正显示*/
      for (var i = tochain.length - 1; i >= 0; i--) {
        cards.bringToTop(tochain[i]);
      }
      activeCard.chain_id = passiveCard.chain_id;
    }
    else {
      console.log('in chain');
      console.log(activeCard.key, passiveCard.key);

      /*当前字牌从链表中分离*/
      if (Math.abs(passiveCard.x - activeCard.x) > CARD_WIDTH) {
        console.log('seprate!');
        /*恢复当前元素的chain_id*/
        removeFromChain(activeCard, tochain, true);
      }
      else {
      
      }
    }

    console.log(chain);
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
    el.chain_id = el.reserve_chain_id;
    chain[el.chain_id].push(el);
  }
}



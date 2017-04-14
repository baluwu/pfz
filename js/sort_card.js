/**
 * arr [{id, img}]
 */
function sortCards(arr) {
  var obj = {};

  /*对子成组*/
  for (var i = 0; i <= arr.length - 1; i++) {

    var el = arr[i], key = el.name;

    if (!obj[key]) {
      obj[key] = { type: 'SINGLE', els: [el] };
    }
    else {
      obj[key].els.push(el);         
      obj[key].type = 'COUPLE';
    }
  } 
  /*有胡子的成话*/
  make3CardToGroup(obj, 'x2', 'x7', 'x10');
  make3CardToGroup(obj, 'x1', 'x2', 'x3');
  make3CardToGroup(obj, 'd2', 'd7', 'd10');
  make3CardToGroup(obj, 'd1', 'd2', 'd3');

  /*单个成话*/
  singleToSentence(obj);
  /*对子成话*/
  coupleToSentence(obj);
  /*大牌横小牌*/
  bigSmallToSentence(obj);

  printLength(obj);

  return obj;
}

function bigSmallToSentence(obj) {
  for (var name in obj) {
    var group = obj[name];
    if (group['type'] == 'SINGLE') {
      var flag = name.slice(0,1);
      var expect = (flag == 'd' ? 'x' : 'd') + name.slice(1);
      
      if (obj[expect] && obj[expect]['type'] == 'SINGLE') {
        group['els'].push(obj[expect]['els'][0]);
        group.type = 'SENTENCE';
        delete obj[expect];
      }
    }
  }
}

function coupleToSentence(obj) {
  for (var name in obj) {
    var group = obj[name];
    if (group['type'] == 'COUPLE' && group['els'].length == 2) {
      var flag = name.slice(0,1);
      var expect = (flag == 'd' ? 'x' : 'd') + name.slice(1);
      
      if (obj[expect] && obj[expect]['type'] == 'SINGLE') {
        group['els'].push(obj[expect]['els'][0]);
        group.type = 'SENTENCE';
        delete obj[expect];
      }
    }
  }
}

/*3字牌成组,如2,7,10*/
function make3CardToGroup(obj, e1, e2, e3) {
  var fst = null, find = 0, e1_len = 0;

  if (obj[e1] && obj[e1]['els'].length == 1) { fst = e1; }

  if (obj[e2] && obj[e2].els.length == 1) {
    if (!fst) fst = e2; 
    else { 
      obj[fst]['els'].push(obj[e2]['els'][0]);
      obj[fst]['type'] = 'SENTENCE';
      delete obj[e2];
      find++;
    } 
  }
  if (obj[e3] && obj[e3].type == 'SINGLE') { 
    if (fst) { 
      obj[fst]['els'].push(obj[e3]['els'][0]);
      obj[fst]['type'] = 'SENTENCE';
      delete obj[e3];
      find++;
    } 
  }
  
  return find == 3;
}

function singleToSentence(obj) {
  for (var name in obj) {
    var agroup = obj[name]['els'];
    if (obj[name].type == 'SINGLE') {
      for (var i = 0; i < agroup.length; i++) {
        var el = agroup[i]['name'];
        var f = el.slice(0, 1);//d,x
        var k = +el.slice(1);
        var succ;

        if (k + 2 <= 10) {
          succ = make3CardToGroup(obj, el, f + (k + 1), f + (k + 2));
        }

        if (!succ && k - 2 > 0) {
          succ = make3CardToGroup(obj, f + (k - 2), f + (k - 1), el);
        }

        if (!succ && k + 1 <= 10 && k - 1 > 0) {
          make3CardToGroup(obj, f + (k - 1), el, f + (k + 1));
        }
      }
    }
  }
}

function printLength(obj) {
  var len = 0;
  for (var name in obj) {
    var agroup = obj[name]['els'];
    for (var i = 0; i < agroup.length; i++) {
      len++;
    }
  }
  
  console.log('chain length: ' + len);
}



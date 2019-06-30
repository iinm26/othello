"use strict";

var WeightData = [
    [30,-12, 0,-1,-1, 0,-12, 30],
    [-12,-15,-3,-3,-3,-3,-15,-12],
    [ 0,-3, 0,-1,-1, 0,-3, 0],
    [-1,-3,-1,-1,-1,-1,-3,-1],
    [-1,-3,-1,-1,-1,-1,-3,-1],
    [ 0,-3, 0,-1,-1, 0,-3, 0],
    [-12,-15,-3,-3,-3,-3,-15,-12],
    [30,-12, 0,-1,-1, 0,-12, 30],
];

var BLACK = 1, WHITE = 2;
var data = [];
var myTurn = false;

function init() {
    var b = document.getElementById("board");

    for (var i = 0; i<8; i++) {
        var tr = document.createElement("tr");
        data[i] = [0,0,0,0,0,0,0,0];
        for (var j = 0; j<8; j++) {
            var td = document.createElement("td");
            td.className = "cell";
            td.id = "cell" + i + j;
            td.onclick = clicked;
            tr.appendChild(td);
        }
        b.appendChild(tr);
    }
    put(3, 3, BLACK);
    put(4, 4, BLACK);
    put(3, 4, WHITE);
    put(4, 3, WHITE);
    update();
}

function update() {
    //黒と白の枚数を数える
    var numWhite = 0, numBlack = 0;
    for (var x = 0; x < 8; x++) {
        for (var y = 0; y < 8; y++) {
            if(data[x][y] == WHITE) {
                numWhite++;
            }
            if(data[x][y] == BLACK) {
                numBlack++;
            }
        }
    }
    //黒と白の枚数を表示する
    document.getElementById("numBlack").textContent = numBlack;
    document.getElementById("numWhite").textContent = numWhite;

    //石を置くことができるか
    var blackFlip = canFlip(BLACK);
    var whiteFlip = canFlip(WHITE);

    if(numWhite + numBlack == 64 || (!blackFlip && !whiteFlip)) {
        showMessage("試合終了")
    }
    //石を置く順番を判定する処理
    else if (!blackFlip) {
        showMessage("黒スキップ");
        myTurn = false;
    }
    else if (!whiteFlip) {
        showMessage("白スキップ");
        myTurn = true;
    }
    else {
        myTurn = !myTurn;
    }
    //CP考えてるフリの時間
    if(!myTurn) {
        setTimeout(think, 1000);
    }
}

function showMessage(str) {
    document.getElementById("message").textContent = str;
    setTimeout(function () {
        document.getElementById("message").textContent = "";
    },2000);
}

//盤上のセルクリック時のコールバック関数
function clicked(e) {
    //CPのターン 
    if(!myTurn) {
        return
    }
    //どのidがクリックされたかを調べる
    var id = e.target.id;
    //縦横の座標を求める 4番目縦、5番目横
    var i = parseInt(id.charAt(4));
    var j = parseInt(id.charAt(5));

    //ひっくり返る石
    var flipped = getFlipCells(i, j, BLACK);
    //反転する石があった場合
    if (flipped.length > 0) {
        for(var k = 0; k < flipped.length; k++) {
            put(flipped[k][0],flipped[k][1],BLACK);
        }
        put(i, j, BLACK);
        update();
    }
}

//(i,j)にcolor色の石を置く
function put(i, j, color) {
    var c = document.getElementById("cell" + i + j);
    c.textContent = "●";
    c.className = "cell " + (color == BLACK ? "black" : "white");
    data[i][j] = color; 
}

//コンピュータ思考関数
function think() {
    var highScore = -1000;
    var px = -1, py = -1;
    for(var x = 0;x < 8 ; x++) {
        for(var y = 0; y < 8 ; y++) {
            var tmpData = copyData();
            var flipped = getFlipCells(x, y, WHITE);
            if (flipped.length > 0) {
                for(var i = 0; i < flipped.length; i++) {
                    var p = flipped[i][0];
                    var q = flipped[i][1];
                    tmpData[p][q] = WHITE;
                    tmpData[x][y] = WHITE;
                } 
                var score = calcWeightData(tmpData);
                if(score > highScore) {
                    highScore = score;
                    px = x, py = y;
                }
            }
        }
    }

    if (px >= 0 && py >= 0) {
        var flipped = getFlipCells(px, py, WHITE)
        if (flipped.length > 0) {
            for (var k = 0; k < flipped.length; k++) {
                put(flipped[k][0], flipped[k][1], WHITE);
            }
        }
        put(px, py, WHITE);
    }
    update();
}

function calcWeightData(tmpData){
    var score = 0;
    for (var x = 0; x < 8; x++) {
        for(var y = 0; y < 8; y++) {
            if(tmpData[x][y] == WHITE) {
                score += WeightData[x][y];
            }
        }
    }
    return score;
}

//石テーブルデータをコピー
function copyData() {
    var tmpData = [];
    for (var x = 0; x < 8; x++) {
        tmpData[x] = [];
        for(var y = 0; y < 8; y++) {
            tmpData[x][y] = data[x][y];
        }
    }
    return tmpData;
}

//挟める石があるか？
function canFlip(color) {
    for(var x = 0; x < 8; x++) {
        for(var y = 0; y < 8; y++) {
            var flipped = getFlipCells(x, y, color);
            if(flipped.length > 0) {
                return true;
            }
        }
    }
    return false;
}

//(i,j)に石を置いた時に石を挟めるか？
function getFlipCells(i,j,color) {
    //既に石が置いてある場合、空の配列を返す
    if(data[i][j] == BLACK || data[i][j] == WHITE) {
        return [];
    }
    //相手石を挟めるか、左上から時計回りに調査
    var dirs = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    var result = [];
    for (var p = 0; p < dirs.length; p++) {
        var flipped = getFlipCellsOneDir(i,j,dirs[p][0],dirs[p][1],color);
        result = result.concat(flipped)
    }
    return result;
}

//(i,j)に石を置いた時に、(dx, dy)方向で石を挟めるか？
function getFlipCellsOneDir(i, j, dx, dy, color) {
    var x = i + dx;
    var y = j + dy;
    var flipped = [];

    //盤外、同色、石がないなら
    if(x < 0 || y < 0 || x > 7 || y > 7 || data[x][y] == color || data[x][y] == 0) {
        return [];　
    }
    //別の色が隣接しているのでflipped配列に保存する
    flipped.push([x,y])

    //その方向で同色で挟めるまで見ていく
    while (true) {
        x += dx;
        y += dy;
        //盤外、石がないなら
        if(x < 0 || y < 0 || x > 7 || y > 7 || data[x][y] == 0) {
            return [];
        }
        //同色があれば挟めたことになる
        if(data[x][y] == color) {
            return flipped;
        //同色でないならばflipped配列に保存し、再びループする
        }else {
            flipped.push([x,y]);
        }
    }
}

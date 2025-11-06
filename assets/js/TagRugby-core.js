/* --------------------------------------------------------------------------
 * Rugby AI platform
 *
 * file           : TagRugby-core.js
 * Version        : 1.2
 * Date           : 1/1/2019
 * Author         : Kazuo Tanaka
 * Author URI     : http://kaduo.jp/
 *
 * -------------------------------------------------------------------------- */

//----------------------------------------
// AIの思考関数
//----------------------------------------
//rugby_AI.'AIの名前'という関数を用意する。pos（agentの位置情報）,turn（アタック番なら1、ディフェンス番なら-1）,select（行動を選択するagent）,ball（ボールを持っているagent）を引数にして、[[動く先のx座標、動く先のy座標],評価値のリスト]を出力するようにする。

let rugby_AI = [];

rugby_AI.AttackAI = function (pos, turn, select, ball, tagged) {
  let return_arr;
  eval(editor.getValue());
  return return_arr;
};

rugby_AI.DefenseSample1 = function (pos, turn, select, ball, tagged) {
  let eval_list = []; //評価値リストの初期化
  let movablelist = movablelistFunc(pos, turn, select, tagged); //動ける場所のリスト,this.taggedを作成

  [checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball); //checkmateFlagはトライorインターセプトできるかのフラグ、x,yがその場合の動く先
  //トライorインターセプトができる場合はその行動を返す
  if (checkmateFlag) {
    return [[x, y], eval_list];
  }

  //ディフェンスの場合：dis_ball(ボールまでの距離)が一番近くなるような移動をする
  if (turn == -1) {
    for (let i = 0; i < movablelist.length; i++) {
      dis_ball = distance(
        movablelist[i][0] - pos[1][ball][0],
        movablelist[i][1] - pos[1][ball][1]
      );
      eval_list.push(-dis_ball + 0.1 * Math.random());
    }
  }
  best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list)); //評価値が最も大きい候補の番号を得る
  best_move_array = [
    movablelist[best_move_index][0],
    movablelist[best_move_index][1],
  ]; //評価値が最も大きい候補の動く場所を返す

  return [best_move_array, eval_list]; //結果を返す
};

rugby_AI.DefenseSample2 = function (pos, turn, select, ball, tagged) {
  let forward_param;
  let eval_list = []; //評価値リストの初期化
  let movablelist = movablelistFunc(pos, turn, select, tagged); //動ける場所のリスト,this.taggedを作成

  [checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball); //checkmateFlagはトライorインターセプトできるかのフラグ、x,yがその場合の動く先
  //トライorインターセプトができる場合はその行動を返す
  if (checkmateFlag) {
    return [[x, y], eval_list];
  }

  //ディフェンスの場合：エージェント自身が左からn番目にいる場合、相手の左からn番目に近づく
  [defenseLine, attackLine] = PosSortTraverse(pos); //defenseLine,attackLineはそれぞれ左からエージェントのIDをリストにしたもの。
  charge = attackLine[defenseLine[select]]; //chargeは自分のマークする相手のエージェント。
  for (let i = 0; i < movablelist.length; i++) {
    dis_ball = distance(
      movablelist[i][0] - pos[1][charge][0],
      movablelist[i][1] - pos[1][charge][1]
    );
    eval_list.push(-dis_ball + 0.1 * Math.random());
  }

  best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list));
  best_move_array = [
    movablelist[best_move_index][0],
    movablelist[best_move_index][1],
  ];

  return [best_move_array, eval_list];
};

function backforthBallFunc(pos, ball, select, y) {
  if (ball == select) {
    return [0, 0];
  } else {
    if (pos[1][ball][1] > y) {
      return [pos[1][ball][1] - y, 0];
    } else {
      return [0, y - pos[1][ball][1]];
    }
  }
}

function difffromhBallFunc(pos, ball, select, x, y) {
  return [Math.abs(x - pos[1][ball][0]), y - pos[1][ball][1]];
}

//AIに必要なパラメータを取得
function getParamForMove(pos, ball, x, y, select) {
  distance_defense = dis_defense_arr_func(pos, x, y); //ディフェンスとの距離リスト
  distance_defense_min = Math.min.apply(null, distance_defense); //ディフェンスとの最小距離
  back_forth_from_goalline = -(y - pos[1][select][1]); //ゴールラインに対する前後の移動距離
  [horizontal_diff_from_ball, vertical_diff_from_ball] = difffromhBallFunc(
    pos,
    ball,
    select,
    x,
    y
  );
  [defenseLine, attackLine] = PosSortTraverse(pos); //defenseLine,attackLineはそれぞれ左からエージェントのIDをリストにしたもの。

  deviation_from_uniform_position = Math.abs(
    (attackLine[select] / (pos[1].length - 1)) * BOARDSIZE - x
  ); //均等に横方向に並ぶ場合の場所からのずれ
  return [
    distance_defense,
    distance_defense_min,
    back_forth_from_goalline,
    horizontal_diff_from_ball,
    vertical_diff_from_ball,
    defenseLine,
    attackLine,
    deviation_from_uniform_position,
  ];
}

//AIのthrow評価に必要なパラメータを取得
function getParamForThrow(pos, ball, i, x, y, select) {
  distance_defense_throw_min = Math.min.apply(
    null,
    dis_defense_arr_func(pos, pos[1][ball][0], pos[1][ball][1])
  ); //ボールを持っているプレイヤーとディフェンスとの最短距離
  pass_distance = distance(x - pos[1][select][0], y - pos[1][select][1]); //パスが成功する確率
  distance_defense_catch_min = Math.min.apply(
    null,
    dis_defense_arr_func(pos, x, y)
  ); //パスを受けるプレイヤーとディフェンスとの最短距離

  return [
    distance_defense_throw_min,
    pass_distance,
    distance_defense_catch_min,
  ];
}
//----------------------------------------
//ディフェンスとアタックのそれぞれ左から右に向かってどのプレイヤーが並んでいるかの配列を返す
//----------------------------------------
function PosSortTraverse(pos) {
  sort = [[], []];
  attackAddIndex = addIndex(pos[1].copy());
  defenseAddIndex = addIndex(pos[0].copy());
  attackSort = xsort(attackAddIndex.copy(), 0, 1);
  defenseSort = xsort(defenseAddIndex.copy(), 0, 1);
  return [transpose(defenseSort)[2], transpose(attackSort)[2]];
}

//----------------------------------------
// x,yの位置にたいしてディフェンスまでの距離の合計を返す
//----------------------------------------
function disDefense(x, y, pos) {
  dis_defense = [];
  for (let j = 0; j < pos[0].length; j++) {
    dis_defense.push(distance(x - pos[0][j][0], y - pos[0][j][1]));
  }
  dis_defense_sum = 0;
  for (let j = 0; j < dis_defense.length; j++) {
    if (dis_defense[j] < 2) {
      return -1;
    } else {
      dis_defense_sum += dis_defense[j];
    }
  }
  return dis_defense_sum;
}

function returnResult(
  movablelist,
  passlist,
  pos,
  turn,
  select,
  ball,
  eval_list
) {
  //トライorインターセプトができる場合はその行動を返す
  [checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball);
  if (checkmateFlag == 1) {
    return_arr = [[x, y], eval_list];
  }

  //最善手を探して手を決める
  best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list)); //評価値が最大値をとる手を選ぶ
  let action_list = []; //候補手配列を生成
  action_list = action_list.concat(movablelist); //候補手配列に移動の候補場所を追加
  action_list = action_list.concat(passlist); //候補手配列にパスの候補場所を追加
  best_move_array = [
    //最も評価値が大きい手を選ぶ
    action_list[best_move_index][0],
    action_list[best_move_index][1],
  ];
  return [best_move_array, eval_list]; //評価値が最大の場所と評価値配列を返す
}

//----------------------------------------
//----------------------------------------
// パラメータの設定
//----------------------------------------
//----------------------------------------
//係数の設定
//移動用
let A = 0; //ゴールラインに対する前後の移動距離の係数
let B = 1; //ディフェンスとの最短距離の係数
//パス用

let C = 1; //パスを受けるプレイヤーとディフェンスとの最短距離の係数
let D = 1; //ボールを持っているプレイヤーとディフェンスとの最短距離の係数
let E = 1; //パスの距離の係数
//定数
let BOARDSIZE = 20;
let BLOCKSIZE = 30; // １マスのサイズ
let CANVASSIZE = 600; // ボードのサイズ
const NUMSIZE = 20; // ボード横の番号幅
let ANALYSISSIZE = 20; //解析結果の数字の大きさ
const boardWordHor = new Array(
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20"
);
const boardWordVer = new Array(
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20"
);

let MAXTAG = 4; //この回数タグをとられるとアタックの負け。
let CATCH_PROBABILITY_LIST = [1, 1, 1, 1, 1, 0.8, 0.8, 0.6, 0.6, 0.4, 0.4]; //キャッチできる確率
const MAX_PASS_LENGTH = CATCH_PROBABILITY_LIST.length - 1; //ボールが投げられる最大距離
//変数
let DELAYDURATION = 1500; // 打ってから反映するまでの時間
let ENDDURATION = 1000; // AI同士でげーむ終了してから次のゲーム開始までの時間
let mouseX = 0; // マウスの横方向座標
let mouseY = 0; // マウスの縦方向座標
let mouseBlockX = ~~(mouseX / BLOCKSIZE); // マウスのマス上での横方向座標
let mouseBlockY = ~~(mouseY / BLOCKSIZE); // マウスのマス上での縦方向座標
gameEndFlag = 0; // ゲーム進行フラグ
AIthinkFlag = 0; // ゲーム進行フラグ
restartFlag = 0;
let attackStoneNum = 0; // アタック石の数
let defenseStoneNum = 0; // ディフェンス石の数
let Role = ["human", "human", "sample1"]; // 思考（Role[0]がディフェンス番、Role[1]がアタック番,Role[2]が解析用AI、human:人間）
let anaRole = ["DefenseSample1", "AttackAI"];
let attack_wins = 0;
let defense_wins = 0;
//色
BOARDCOLOR = "#f4f8ff";
ATTACKFILLCOLOR = "#3FB6EA";
ATTACKBORDERCOLOR = "#000000";
DEFENSEFILLCOLOR = "#D11036";
DEFENSEBORDERCOLOR = "#000000";
BOARDERCOLOR = "#3f3f3f";
BACKGROUNDCOLOR = "#ffffff";
FONTCOLOR = "#3f3f3f";
ANAMOVEFONTCOLOR = "#3f3f3f";
ANAPASSFONTCOLOR = "#ffffff";
INGOALCOLOR = "#F27575";
BALLCOLOR = "#c65353";
SELECTDISC = "#3f3f3f";
FINALDISC = "#c65353";
TAG_IMG = '<img src="./assets/img/tag.png" width="20px">';
let POSATTACK = [
  //アタックの位置の初期設定
  [3, 10], //1人目
  [6, 10], //2人目
  [9, 10], //3人目
  [12, 10], //4人目
  [15, 10], //5人目
];

let POSDEFENSE = [
  //ディフェンスの位置の初期設定
  [3, 7], //1人目
  [5, 7], //2人目
  [7, 7], //3人目
  [9, 7], //4人目
  [11, 7], //5人目
];
let sample = {
  1: {
    boardsize: 6,
    attackpos: [[4, 5]],
    defensepos: [[5, 4]],
  },

  2: {
    boardsize: 6,
    attackpos: [[0, 4]],
    defensepos: [[4, 2]],
  },
  3: {
    boardsize: 6,
    attackpos: [[3, 4]],
    defensepos: [[3, 2]],
  },
  4: {
    boardsize: 6,
    attackpos: [
      [0, 3],
      [5, 3],
    ],
    defensepos: [
      [1, 1],
      [2, 1],
    ],
  },
  5: {
    boardsize: 6,
    attackpos: [
      [0, 3],
      [4, 3],
    ],
    defensepos: [
      [1, 1],
      [3, 1],
    ],
  },
  6: {
    boardsize: 6,
    attackpos: [
      [0, 3],
      [4, 3],
    ],
    defensepos: [
      [2, 2],
      [3, 4],
    ],
  },
};

//----------------------------------------
//----------------------------------------
// ゲームを制御するクラス
//----------------------------------------
//----------------------------------------
class Game {
  constructor(AI1, AI2) {
    this.init(AI1, AI2);
  } //コンストラクタ（	クラスのインスタンス生成時に呼ばれる）
  init(AI1, AI2) {
    //AIの初期化
    this.Role = [];
    this.Role[1] = AI1;
    this.Role[0] = AI2;
    //パラメータの初期化
    this.turn = 1; // ターン(1がアタック、-1がディフェンス)
    // コマの位置の初期化
    this.pos = [];
    this.pos[0] = POSDEFENSE.copy();
    this.pos[1] = POSATTACK.copy();
    this.select = 0;
    this.ball = 0;
    this.step = 0;
    this.tag = MAXTAG;
    this.nextmove = []; //次の一手の配列
    this.eval_list = []; //評価値リストの配列
    this.wait = -1;
    this.tagged = 0;
  }
  humanTurn(x, y) {
    if (this.select == 0 && this.turn == 1) {
      this.step += 1;
    }
    let movablelist = movablelistFunc(
      this.pos.copy(),
      this.turn,
      this.select,
      this.tagged
    ); //動ける場所のリストを作成
    let passlist = passlistFunc(
      this.pos.copy(),
      this.turn,
      this.select,
      this.ball
    ); //動ける場所のリストを作成
    //一回休みの場合の処理
    if (this.select == this.wait) {
      this.wait = -1;
      [this.select, this.turn, this.tagged] = stepPhaseFunc(
        this.select,
        this.pos,
        this.turn,
        this.ball,
        this.tagged
      );
    }
    //動ける場所がない場合の処理
    else if (movablelist.length == 0 && passlist.length == 0) {
      const passElement = document.getElementById("pass");
      if (passElement) {
        passElement.innerHTML = "動けるところがないので1回休み";
      }
      [this.select, this.turn, this.tagged] = stepPhaseFunc(
        this.select,
        this.pos,
        this.turn,
        this.ball,
        this.tagged
      );
    }
    //タグが取られた場合の処理
    else if (tagJudgeFunc(this.select, this.pos, this.turn, this.ball, x, y)) {
      if (this.tag == 1) {
        gameOver(-1, x, y);
        return;
      } else {
        this.tag -= 1;
        this.tagged = 1;
        this.tagged_disp = 1;
        tag = "";
        for (let i = 0; i < this.tag; i++) {
          tag += TAG_IMG;
        }
        document.getElementById("tag").innerHTML = tag;
        [this.select, this.turn, this.tagged] = taggedstepPhaseFunc(
          this.select,
          this.pos,
          this.turn,
          this.ball,
          this.tagged
        );
      }
    } else {
      let catchable = catchableFunc(
        this.pos,
        this.turn,
        this.select,
        this.ball,
        x,
        y
      );
      //パスした場合の処理
      if (catchable != -1) {
        this.wait = try_catch(
          this.ball,
          catchable,
          x,
          y,
          this.pos[this.turn][this.select][0],
          this.pos[this.turn][this.select][1],
          this.wait
        );
        this.ball = catchable;
        [this.select, this.turn, this.tagged] = stepPhaseFunc(
          this.select,
          this.pos,
          this.turn,
          this.ball,
          this.tagged
        );
      }
      //移動する場合の処理
      else {
        for (let i = 0; i < movablelist.length; i++) {
          if (x == movablelist[i][0] && y == movablelist[i][1]) {
            this.pos[arrayTurn(this.turn)][this.select][0] = x;
            this.pos[arrayTurn(this.turn)][this.select][1] = y;
            [this.select, this.turn, this.tagged] = stepPhaseFunc(
              this.select,
              this.pos,
              this.turn,
              this.ball,
              this.tagged
            );
          }
        }
        //トライした場合の処理
        if (tryJudgeFunc(this.pos, this.ball)) {
          gameOver(1, x, y);
          return;
        }
      }
    }
    if (this.Role[arrayTurn(this.turn)] != "human") {
      AIthinkFlag = 1;
      setTimeout("game.AIturn()", DELAYDURATION);
    }
    draw(ctx, canvas);
    return;
  }

  AIturn() {
    clearError();
    //AIの思考
    if (this.select == 0 && this.turn == 1) {
      this.step += 1;
    }
    let AI_name = Role[arrayTurn(this.turn)]; //AIの名前を定義
    let nextmove = [];
    let eval_list = [];

    let movablelist = movablelistFunc(
      this.pos.copy(),
      this.turn,
      this.select,
      this.tagged
    ); //動ける場所のリストを作成
    let passlist = passlistFunc(
      this.pos.copy(),
      this.turn,
      this.select,
      this.ball
    ); //動ける場所のリストを作成
    if (movablelist.length != 0 || passlist.length != 0) {
      [nextmove, eval_list] = rugby_AI[AI_name](
        this.pos,
        this.turn,
        this.select,
        this.ball,
        this.tagged
      ); //AIの呼び出し、盤面から最善手及びそれぞれの評価値を返す
    }
    if (
      nextmove == [] ||
      typeof nextmove[0] === "undefined" ||
      typeof nextmove[1] === "undefined"
    ) {
      [this.select, this.turn, this.tagged] = stepPhaseFunc(
        this.select,
        this.pos,
        this.turn,
        this.ball,
        this.tagged
      );
    }
    //一回休みの場合の処理
    else if (this.select == this.wait) {
      this.wait = -1;
      [this.select, this.turn, this.tagged] = stepPhaseFunc(
        this.select,
        this.pos,
        this.turn,
        this.ball,
        this.tagged
      );
    }

    //動ける場所がない場合の処理
    else if (movablelist.length == 0 && passlist.length == 0) {
      //	document.getElementById('pass').innerHTML = '動けるところがないので1回休み';
      [this.select, this.turn, this.tagged] = stepPhaseFunc(
        this.select,
        this.pos,
        this.turn,
        this.ball,
        this.tagged
      );
    }

    //タグが取られた場合の処理
    else if (
      tagJudgeFunc(
        this.select,
        this.pos,
        this.turn,
        this.ball,
        nextmove[0],
        nextmove[1]
      )
    ) {
      if (this.tag == 1) {
        gameOver(-1, nextmove[0], nextmove[1]);
        return;
      } else {
        this.tag -= 1;
        this.tagged = 1;
        this.tagged_disp = 1;
        tag = "";
        for (let i = 0; i < this.tag; i++) {
          tag += TAG_IMG;
        }
        document.getElementById("tag").innerHTML = tag;
        [this.select, this.turn, this.tagged] = taggedstepPhaseFunc(
          this.select,
          this.pos,
          this.turn,
          this.ball,
          this.tagged
        );
      }
    } else {
      let catchable = catchableFunc(
        this.pos,
        this.turn,
        this.select,
        this.ball,
        nextmove[0],
        nextmove[1]
      );
      //パスした場合の処理
      if (catchable != -1) {
        this.wait = try_catch(
          this.ball,
          catchable,
          x,
          y,
          this.pos[this.turn][this.select][0],
          this.pos[this.turn][this.select][1],
          this.wait
        );
        this.ball = catchable;
        [this.select, this.turn, this.tagged] = stepPhaseFunc(
          this.select,
          this.pos,
          this.turn,
          this.ball,
          this.tagged
        );
      }
      //移動する場合の処理
      else {
        this.pos[arrayTurn(this.turn)][this.select][0] = nextmove[0];
        this.pos[arrayTurn(this.turn)][this.select][1] = nextmove[1];
        [this.select, this.turn, this.tagged] = stepPhaseFunc(
          this.select,
          this.pos,
          this.turn,
          this.ball,
          this.tagged
        );
        //トライした場合の処理
        if (tryJudgeFunc(this.pos, this.ball)) {
          gameOver(1, x, y);
          return;
        }
      }
    }
    if (this.Role[arrayTurn(this.turn)] != "human") {
      AIthinkFlag = 1;
      setTimeout("game.AIturn()", DELAYDURATION);
    }
    AIthinkFlag = 0;
    draw(ctx, canvas);
  }
}
//----------------------------------------
// tagJudgeFunc tagがとられたか判定
//----------------------------------------
function tagJudgeFunc(select, pos, turn, ball, x, y) {
  if (
    Math.abs(pos[arrayTurn(turn)][select][0] - x) <= 1 &&
    Math.abs(pos[arrayTurn(turn)][select][1] - y) <= 1 &&
    [x, y] != pos[arrayTurn(turn)][select]
  ) {
    if (turn == -1 && x == pos[1][ball][0] && y == pos[1][ball][1]) {
      return 1;
    }
  }
  return 0;
}

//----------------------------------------
// tryJudgeFunc トライしているか判定
//----------------------------------------
function tryJudgeFunc(pos, ball) {
  if (pos[1][ball][1] == 0) {
    return 1;
  } else {
    return 0;
  }
}

//----------------------------------------
// stepPhaseFunc 次のターンへ移行する関数
//---------------,this.tagged-------------------------
function stepPhaseFunc(select, pos, turn, ball, tagged) {
  if (turn == 1) {
    if (
      select > pos[arrayTurn(turn * -1)].length - 1 &&
      select < pos[arrayTurn(turn)].length - 1
    ) {
      select += 1;
    } else {
      turn *= -1;
    }
  } else {
    if (
      select >= pos[arrayTurn(turn * -1)].length - 1 &&
      select < pos[arrayTurn(turn)].length - 1
    ) {
      select += 1;
    } else {
      if (select >= pos[arrayTurn(turn * -1)].length - 1) {
        turn *= -1;
        select = 0;
      } else {
        turn *= -1;
        select += 1;
      }
    }
  }

  tagged = 0;

  return [select, turn, tagged];
}
//----------------------------------------
// taggedstepPhaseFunc タグされたとに次のターンへ移行する関数
//---------------,this.tagged-------------------------
function taggedstepPhaseFunc(select, pos, turn, ball, tagged) {
  return [ball, 1, 1];
}
//----------------------------------------
// movablelistFunc コマのポジションとターンと選択しているコマを引数にして置ける,this.tagged位置のポジションのリストを返す
//----------------------------------------
function movablelistFunc(pos, turn, select, tagged) {
  if (tagged == 1) {
    return [];
  }
  movablelist = [];
  for (let i = -1; i <= 1; i++) {
    overlapSpace: for (let j = -1; j <= 1; j++) {
      if (
        !(i == 0 && j == 0) &&
        pos[arrayTurn(turn)][select][0] + i >= 0 &&
        pos[arrayTurn(turn)][select][0] + i < BOARDSIZE &&
        pos[arrayTurn(turn)][select][1] + j >= 0 &&
        pos[arrayTurn(turn)][select][1] + j < BOARDSIZE
      ) {
        for (let k = 0; k < pos[0].length; k++) {
          if (
            pos[arrayTurn(turn)][select][0] + i == pos[0][k][0] &&
            pos[arrayTurn(turn)][select][1] + j == pos[0][k][1]
          ) {
            continue overlapSpace;
          }
        }
        for (let k = 0; k < pos[1].length; k++) {
          if (
            pos[arrayTurn(turn)][select][0] + i == pos[1][k][0] &&
            pos[arrayTurn(turn)][select][1] + j == pos[1][k][1]
          ) {
            continue overlapSpace;
          }
        }
        movablelist.push([
          pos[arrayTurn(turn)][select][0] + i,
          pos[arrayTurn(turn)][select][1] + j,
        ]);
      }
    }
  }
  return movablelist;
}

//----------------------------------------
// passlistFunc パスできる場所のリストを返す
//----------------------------------------
function passlistFunc(pos, turn, select, ball) {
  passlist = [];
  if (select == ball) {
    //ボールを投げるか判断

    for (let i = 0; i < pos[1].length; i++) {
      if (
        turn == 1 &&
        i != select &&
        pos[1][select][1] <= pos[1][i][1] &&
        distance(
          pos[1][select][0] - pos[1][i][0],
          pos[1][select][1] - pos[1][i][1]
        ) <= MAX_PASS_LENGTH
      ) {
        passlist.push([pos[1][i][0], pos[1][i][1]]); //投げる候補の追加
      }
    }
  }
  return passlist;
}
//----------------------------------------
// インターセプトできるかチェック。できたらflagとそのポジションを返す
//----------------------------------------
function CheckMateFunc(pos, turn, select, ball) {
  if (turn == -1) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (
          (ball,
          pos[arrayTurn(turn)][select][0] + i == pos[1][ball][0] &&
            pos[arrayTurn(turn)][select][1] + j == pos[1][ball][1])
        ) {
          return [
            1,
            pos[arrayTurn(turn)][select][0] + i,
            pos[arrayTurn(turn)][select][1] + j,
          ];
        }
      }
    }
  } else if (turn == 1) {
    if (pos[1][select][1] <= 1 && select == ball) {
      return [1, pos[1][select][0], 0];
    }
  }
  return [0, 0, 0];
}

//----------------------------------------
// catchableFunc 選択した場所が投げられるか判定。投げられたら1を返す。
//----------------------------------------
function catchableFunc(pos, turn, select, ball, x, y) {
  if (turn == 1 && select == ball) {
    for (let i = 0; i < pos[1].length; i++) {
      if (
        pos[1][i][0] == x &&
        pos[1][i][1] == y &&
        pos[1][i][1] >= pos[1][select][1] &&
        i != select
      ) {
        return i;
      }
    }
  }
  return -1;
}

//----------------------------------------
// canvasサイズが変更されたときの調整
//----------------------------------------
function canvas_resize() {
  boardarea = document.getElementsByClassName("boardarea");
  canvas = document.getElementById("canvas");
  canvas.setAttribute("width", boardarea[0].clientWidth * 0.8);
  canvas.setAttribute("height", boardarea[0].clientWidth * 0.8);
  if (!canvas || !canvas.getContext) {
    return false;
  }
  ctx = canvas.getContext("2d"); // contextを取得する
  CANVASSIZE = canvas.clientWidth - NUMSIZE - 1;
  BLOCKSIZE = CANVASSIZE / BOARDSIZE;
  ANALYSISSIZE = 0.5 * BLOCKSIZE;
  draw(ctx, canvas);
}

//----------------------------------------
// 初期化
//----------------------------------------
function init() {
  //イベントリスナの設定
  // マウスが動くとmoveMouseを呼び出す
  canvas.onmousemove = function (event) {
    moveMouse(event);
  };
  //マウスがクリックするとhumanTurnを呼び出す。既にゲーム終了後の場合はinitを呼び出す。
  canvas.onclick = function () {
    if (AIthinkFlag == 0) {
      game.humanTurn(mouseBlockX, mouseBlockY);
    }
  };
  //パラメータの初期化
  gameEndFlag = 0;
  game = new Game(Role[0], Role[1]);
  tag = "";
  for (let i = 0; i < MAXTAG; i++) {
    tag += TAG_IMG;
  }
  document.getElementById("tag").innerHTML = tag;

  // キャンバスの設定
  window.addEventListener("resize", canvas_resize, false);
  canvas_resize();

  // 初期描画
  draw(ctx, canvas);

  //初手がAIの場合はAIの思考を開始
  if (Role[1] != "human") {
    AIthinkFlag = 1;
    reuslt = game.AIturn();
  }
}

//----------------------------------------
// 初期盤面からゲームをやり直し
//----------------------------------------
function rematch() {
  rematchInit();
  if (Role[arrayTurn(game.turn)] != "human") {
    AIthinkFlag = 1;
    game.AIturn();
  }
}

function rematchInit() {
  const resultElement = document.getElementById("result");
  if (resultElement) {
    resultElement.innerHTML = "";
  }
  AIthinkFlag = 0;
  game.turn = 1;
  game.pos[0] = POSDEFENSE.copy();
  game.pos[1] = POSATTACK.copy();
  game.select = 0;
  game.ball = 0;
  game.step = 0;
  game.tag = MAXTAG;
  tag = "";
  for (let i = 0; i < MAXTAG; i++) {
    tag += TAG_IMG;
  }
  document.getElementById("tag").innerHTML = tag;
  draw(ctx, canvas);
}
//----------------------------------------
// コンフィグ設定ボタンをおした時の動作
//----------------------------------------
function config() {
  try {
    BOARDSIZE = parseInt(document.ConfigForm.boardsize.value);
    attack_num = parseInt(document.ConfigForm.attackNum.value);
    defense_num = parseInt(document.ConfigForm.defenseNum.value);
    MAXTAG = parseInt(document.ConfigForm.tag_num.value);
    //初期配置を読み込み
    eval(pos_editor.getValue());
  } catch (err) {
    document.getElementById("poserror").innerHTML =
      "初期位置の書き方が正しくありません。" + err;
  }
  CATCH_PROBABILITY_LIST = [1, 1, 1, 1, 1, 0.8, 0.8, 0.6, 0.6, 0.4, 0.4];
  POSATTACK = POSATTACK.slice(0, attack_num);
  POSDEFENSE = POSDEFENSE.slice(0, defense_num);
  rematchInit();
}

//----------------------------------------
// コンフィグ設定ボタンをおした時の動作
//----------------------------------------
function setAI() {
  eval(document.CodingForm.attackAIfunc.value);
}

//----------------------------------------
// 設定ボタンをおした時の動作
//----------------------------------------
function restart() {
  //戦歴をリセットする
  document.getElementById("attack_win_num").innerHTML = 0;
  document.getElementById("defense_win_num").innerHTML = 0;
  tag = "";
  for (let i = 0; i < MAXTAG; i++) {
    tag += TAG_IMG;
  }
  document.getElementById("tag").innerHTML = tag;

  //	アタック番とディフェンス番の思考を読み込む
  Role[1] = document.ControlForm.attack_role.value;
  Role[0] = document.ControlForm.defense_role.value;
  game.Role[0] = Role[0];
  game.Role[1] = Role[1];
  //	ゲームスピードを設定する
  game_speed = document.ControlForm.game_speed.value;
  if (game_speed == 0) {
    //低速
    DELAYDURATION = 1500;
    ENDDURATION = 1000;
  } else if (game_speed == 1) {
    //高速
    DELAYDURATION = 100;
    ENDDURATION = 1000;
  } else {
    //超高速
    DELAYDURATION = 0;
    ENDDURATION = 1000;
  }

  //	手番がAI
  if (Role[arrayTurn(game.turn)] != "human" && restartFlag == 0) {
    AIthinkFlag = 1;
    game.AIturn();
  }

  //	１つ前が全自動の時は新たにAIturn()を呼ばないようにフラグを立てる
  if (Role[0] != "human" && Role[1] != "human") {
    restartFlag = 1;
  } else {
    restartFlag = 0;
  }
}

//----------------------------------------
// ゲーム終了時に呼び出す関数
//----------------------------------------

function gameOver(result_Diff, x, y) {
  gameEndFlag = 1; //ゲーム終了フラグをtrueにする。
  drawFinalDisc(ctx, canvas, x, y);
  //勝敗の判定
  if (result_Diff == 1) {
    //アタック勝ち
    attack_wins += 1;
    document.getElementById("attack_win_num").innerHTML =
      "攻め手 " + attack_wins + "回";
  } else if (result_Diff == -1) {
    //ディフェンス勝ち
    defense_wins += 1;
    document.getElementById("defense_win_num").innerHTML =
      "守り手 " + defense_wins + "回";
  }
  document
    .getElementById("attack_win_num")
    .setAttribute(
      "style",
      "width: " + (attack_wins / (attack_wins + defense_wins)) * 100 + "%"
    );
  document
    .getElementById("defense_win_num")
    .setAttribute(
      "style",
      "width: " + (defense_wins / (attack_wins + defense_wins)) * 100 + "%"
    );

  //CPU同士の対決の場合は自動的に次の対局を開始
  setTimeout("rematch()", ENDDURATION);
}

//----------------------------------------
// サンプル設定ボタンをおした時の動作
//----------------------------------------
function sampleset() {
  sample_num = parseInt(document.SampleForm.samplenum.value);
  BOARDSIZE = sample[sample_num].boardsize;
  POSATTACK = sample[sample_num].attackpos;
  POSDEFENSE = sample[sample_num].defensepos;
  CATCH_PROBABILITY_LIST = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  rematchInit();
}

//----------------------------------------
// マウスの移動
//----------------------------------------
function moveMouse(event) {
  // マウス座標の取得
  mouseX = event.offsetX;
  mouseY = event.offsetY;

  // 実座標
  mouseX = ~~((mouseX / canvas.offsetWidth) * (CANVASSIZE + NUMSIZE));
  mouseY = ~~((mouseY / canvas.offsetHeight) * (CANVASSIZE + NUMSIZE));

  // マス座標
  mouseBlockX = ~~((mouseX - NUMSIZE - 0.5) / BLOCKSIZE);
  mouseBlockY = ~~((mouseY - NUMSIZE - 0.5) / BLOCKSIZE);
}

//----------------------------------------
// すべての描画
//----------------------------------------
function drawFinalDisc(ctx, canvas, x, y) {
  ctx.beginPath();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(
    x * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
    y * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
    (BLOCKSIZE / 2) * 0.8,
    0,
    2 * Math.PI,
    false
  );
  ctx.fill();
  ctx.stroke();
}

function draw(ctx, canvas) {
  refreshParam();
  // マウス位置の取得
  let mouseBlockXr = mouseBlockX * BLOCKSIZE + NUMSIZE;
  let mouseBlockYr = mouseBlockY * BLOCKSIZE + NUMSIZE;

  // 描画の削除
  ctx.clearRect(0, 0, CANVASSIZE + NUMSIZE, CANVASSIZE + NUMSIZE);

  // ゴールエリアの表示
  ctx.beginPath();
  ctx.globalAlpha = 1;
  ctx.fillStyle = INGOALCOLOR;
  ctx.fillRect(NUMSIZE + 0.5, NUMSIZE + 0.5, BLOCKSIZE * BOARDSIZE, BLOCKSIZE);
  ctx.fill();

  // 罫線の描画
  ctx.beginPath();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = BOARDERCOLOR;
  for (let i = 0; i <= BOARDSIZE; i++) {
    ctx.moveTo(~~(i * BLOCKSIZE) + NUMSIZE + 0.5, 0.5);
    ctx.lineTo(~~(i * BLOCKSIZE) + NUMSIZE + 0.5, CANVASSIZE + NUMSIZE + 0.5);

    ctx.moveTo(0.5, ~~(i * BLOCKSIZE) + NUMSIZE + 0.5);
    ctx.lineTo(CANVASSIZE + NUMSIZE + 0.5, ~~(i * BLOCKSIZE) + NUMSIZE + 0.5);
  }
  ctx.stroke();

  //選択コマの表示
  ctx.lineWidth = 0;
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = SELECTDISC;
  ctx.fillRect(
    game.pos[arrayTurn(game.turn)][game.select][0] * BLOCKSIZE + NUMSIZE + 0.5,
    game.pos[arrayTurn(game.turn)][game.select][1] * BLOCKSIZE + NUMSIZE + 0.5,
    BLOCKSIZE,
    BLOCKSIZE
  );
  ctx.fill();

  // コマの表示
  ctx.globalAlpha = 1;
  for (let i = 0; i <= 1; i++) {
    if (i == 0) {
      ctx.fillStyle = DEFENSEFILLCOLOR;
      ctx.strokeStyle = DEFENSEBORDERCOLOR;
    }
    if (i == 1) {
      ctx.fillStyle = ATTACKFILLCOLOR;
      ctx.strokeStyle = ATTACKBORDERCOLOR;
    }
    for (let j = 0; j < game.pos[i].length; j++) {
      ctx.beginPath();
      ctx.arc(
        game.pos[i][j][0] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
        game.pos[i][j][1] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
        (BLOCKSIZE / 2) * 0.8,
        0,
        2 * Math.PI,
        false
      );
      ctx.fill();
      ctx.stroke();
    }
  }

  //ボールの表示
  let ball = new Image();
  ball.src = "./assets/img/ball.svg";
  ball.onload = function () {
    ctx.drawImage(
      ball,
      game.pos[1][game.ball][0] * BLOCKSIZE +
        ~~(BLOCKSIZE * 0.5) +
        NUMSIZE +
        0.5 -
        BLOCKSIZE * 0.3,
      game.pos[1][game.ball][1] * BLOCKSIZE +
        ~~(BLOCKSIZE * 0.5) +
        NUMSIZE +
        0.5 -
        BLOCKSIZE * 0.3,
      BLOCKSIZE * 0.6,
      BLOCKSIZE * 0.6
    );
  };

  // ボード脇の色を設定
  ctx.beginPath();
  ctx.globalAlpha = 1;
  ctx.fillStyle = BACKGROUNDCOLOR;
  ctx.rect(0, 0, CANVASSIZE + NUMSIZE, NUMSIZE);
  ctx.rect(0, 0, NUMSIZE, CANVASSIZE + NUMSIZE);
  ctx.fill();

  for (let i = 0; i < BOARDSIZE; i++) {
    // 文字の表示
    ctx.beginPath();
    ctx.font = NUMSIZE * 0.8 + "px Osaka";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = FONTCOLOR;
    ctx.fillText(
      boardWordVer[i],
      (i + 0.5) * BLOCKSIZE + NUMSIZE + 0.5,
      NUMSIZE * 0.5
    );
    ctx.fillText(
      boardWordHor[i],
      NUMSIZE * 0.5,
      (i + 0.5) * BLOCKSIZE + NUMSIZE + 0.5
    );
  }
  //可動範囲の表示
  if (game.select != game.wait) {
    ctx.globalAlpha = 0.2;
    let movablelist = movablelistFunc(
      game.pos,
      game.turn,
      game.select,
      this.tagged
    );
    if (game.turn == -1) {
      ctx.fillStyle = DEFENSEFILLCOLOR;
      ctx.strokeStyle = DEFENSEBORDERCOLOR;
    }
    if (game.turn == 1) {
      ctx.fillStyle = ATTACKFILLCOLOR;
      ctx.strokeStyle = ATTACKBORDERCOLOR;
    }
    for (let i = 0; i < movablelist.length; i++) {
      ctx.beginPath();
      ctx.arc(
        movablelist[i][0] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
        movablelist[i][1] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
        (BLOCKSIZE / 2) * 0.8,
        0,
        2 * Math.PI,
        false
      );
      ctx.fill();
      ctx.stroke();
    }
    if (game.select == game.ball) {
      let passlist = passlistFunc(
        game.pos.copy(),
        game.turn,
        game.select,
        game.ball
      );
      ctx.fillStyle = BALLCOLOR;
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < passlist.length; i++) {
        ctx.beginPath();
        ctx.arc(
          passlist[i][0] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
          passlist[i][1] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
          (BLOCKSIZE / 2) * 0.3,
          0,
          2 * Math.PI,
          false
        );
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = FONTCOLOR;
  ctx.globalAlpha = 0.5;
  //一回休みがある場合は表示
  //if (game.wait != -1) {
  //	ctx.fillText('パス失敗のため１回休み', game.pos[1][game.wait][0] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5, game.pos[1][game.wait][1] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5);
  ///}
  //タグを取られた場合は表示
  //if (game.tagged == 1) {
  //	ctx.fillText('タグを取られたので、ボールを投げる', game.pos[1][game.ball][0] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5, game.pos[1][game.ball][1] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5);
  //	}
}

//----------------------------------------
// 評価値を返す
//----------------------------------------
function analysis() {
  clearError();
  ctx.clearRect(0, 0, CANVASSIZE + NUMSIZE, CANVASSIZE + NUMSIZE);
  draw(ctx, canvas);
  ctx.beginPath();
  ctx.font = ANALYSISSIZE + "px Osaka";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.globalAlpha = 1;
  ctx.fillStyle = FONTCOLOR;

  action_list = [];
  let movablelist = movablelistFunc(
    game.pos.copy(),
    game.turn,
    game.select,
    game.tagged
  ); //動ける場所のリストを作成
  let passlist = passlistFunc(
    game.pos.copy(),
    game.turn,
    game.select,
    game.ball
  ); //動ける場所のリストを作成
  action_list = action_list.concat(movablelist);
  action_list = action_list.concat(passlist);

  if (action_list.length == 0) {
    return;
  }
  AI_name = anaRole[arrayTurn(game.turn)];

  [nextmove, eval_list] = rugby_AI[AI_name](
    game.pos,
    game.turn,
    game.select,
    game.ball,
    game.tagged
  );

  ctx.fillStyle = ANAMOVEFONTCOLOR;
  for (let i = 0; i < movablelist.length; i++) {
    ctx.fillText(
      Math.floor(eval_list[i]),
      action_list[i][0] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
      action_list[i][1] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5
    );
  }
  ctx.fillStyle = ANAPASSFONTCOLOR;
  for (
    let i = movablelist.length;
    i < movablelist.length + passlist.length;
    i++
  ) {
    ctx.fillText(
      Math.floor(eval_list[i]),
      action_list[i][0] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
      action_list[i][1] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5
    );
  }
}

//----------------------------------------
// パラメータを更新する
//----------------------------------------
function refreshParam() {
  [
    distance_defense, //守り手までの距離（配列）
    distance_defense_min, //守り手までの最小距離
    back_forth_from_goalline, //ゴールラインに対する前後の移動距離（前は１、後ろはー１、横は０）
    horizontal_diff_from_ball, //ボールを持っているプレイヤーとの横方向の距離
    vertical_diff_from_ball, //ボールを持っているプレイヤーとの縦方向の距離
    defenseLine, //守り手の左からの順番を表した配列
    attackLine, //攻め手の左からの順番を表した配列
    deviation_from_uniform_position, //均等に横方向に並ぶ場合の場所からのずれ
  ] = getParamForMove(
    game.pos,
    game.ball,
    game.pos[(game.turn + 1) / 2][game.select][0],
    game.pos[(game.turn + 1) / 2][game.select][1],
    game.select
  );

  document.getElementById("param_step").innerHTML = game.step;

  for (let i = 0, len = 4; i <= len; i++) {
    document
      .getElementById("param_ball_" + i)
      .classList.remove("paramBadgeSelected");
  }
  document
    .getElementById("param_ball_" + game.ball)
    .classList.add("paramBadgeSelected");

  for (let i = 0, len = 4; i <= len; i++) {
    document
      .getElementById("param_select_" + i)
      .classList.remove("paramBadgeSelected");
  }
  document
    .getElementById("param_select_" + game.select)
    .classList.add("paramBadgeSelected");
  for (let i = 1, len = 4; i <= len; i++) {
    document
      .getElementById("param_tag_" + i)
      .classList.remove("paramBadgeSelected");
  }
  document
    .getElementById("param_tag_" + game.tag)
    .classList.add("paramBadgeSelected");

  if (game.wait) {
    document
      .getElementById("param_wait_0")
      .classList.remove("paramBadgeSelected");
    document.getElementById("param_wait_1").classList.add("paramBadgeSelected");
  } else {
    document
      .getElementById("param_wait_1")
      .classList.remove("paramBadgeSelected");
    document.getElementById("param_wait_0").classList.add("paramBadgeSelected");
  }

  if (game.tagged) {
    document
      .getElementById("param_tagged_0")
      .classList.remove("paramBadgeSelected");
    document
      .getElementById("param_tagged_1")
      .classList.add("paramBadgeSelected");
  } else {
    document
      .getElementById("param_tagged_1")
      .classList.remove("paramBadgeSelected");
    document
      .getElementById("param_tagged_0")
      .classList.add("paramBadgeSelected");
  }

  if (game.turn) {
    document
      .getElementById("param_turn_0")
      .classList.remove("paramBadgeSelected");
    document.getElementById("param_turn_1").classList.add("paramBadgeSelected");
  } else {
    document
      .getElementById("param_turn_1")
      .classList.remove("paramBadgeSelected");
    document.getElementById("param_turn_0").classList.add("paramBadgeSelected");
  }
  for (let i = 0, len = distance_defense.length - 1; i <= len; i++) {
    document.getElementById("param_distance_" + i).innerHTML =
      distance_defense[i].toFixed(1);
  }
  document.getElementById("param_distance_defense_min").innerHTML =
    distance_defense_min.toFixed(1);
  document.getElementById("param_horizontal_diff_from_ball").innerHTML =
    horizontal_diff_from_ball;
  document.getElementById("param_vertical_diff_from_ball").innerHTML =
    vertical_diff_from_ball;
  for (let i = 0, len = defenseLine.length - 1; i <= len; i++) {
    document.getElementById("param_defenseLine_" + i).innerHTML =
      defenseLine[i];
  }
  for (let i = 0, len = attackLine.length - 1; i <= len; i++) {
    document.getElementById("param_attackLine_" + i).innerHTML = attackLine[i];
  }
  document.getElementById("param_deviation_from_uniform_position").innerHTML =
    deviation_from_uniform_position;

  let passlist = passlistFunc(game.pos, game.turn, game.select, game.ball); //パスの候補場所配列を作成
  for (let i = 0; i <= game.pos[1].length - 1; i++) {
    //パス場所に対して順番に評価値を調べる
    [
      distance_defense_throw_min, //ボールを持っているプレイヤーとディフェンスとの最短距離
      pass_distance, //パスが成功する確率
      distance_defense_catch_min, //パスを受けるプレイヤーとディフェンスとの最短距離
    ] = getParamForThrow(
      game.pos,
      game.ball,
      i,
      game.pos[1][i][0],
      game.pos[1][i][1],
      game.select
    );
    document.getElementById("param_distance_defense_catch_min_" + i).innerHTML =
      distance_defense_catch_min.toFixed(1);
    document.getElementById("param_pass_distance_" + i).innerHTML =
      pass_distance.toFixed(1);
  }
  document.getElementById("param_distance_defense_throw_min").innerHTML =
    distance_defense_throw_min.toFixed(1);
}

//----------------------------------------
//----------------------------------------
// その他の関数
//----------------------------------------
//----------------------------------------
function arrayTurn(turn) {
  return (turn + 1) / 2;
}
//----------------------------------------
// 配列のコピーメソッド
//----------------------------------------
Array.prototype.copy = function () {
  let obj = [];

  for (let i = 0, len = this.length; i < len; i++) {
    if (this[i].length > 0 && this[i].copy()) {
      obj[i] = this[i].copy();
    } else {
      obj[i] = this[i];
    }
  }

  return obj;
};

function xsort(arrs, col, order) {
  //二次元配列のソート
  //col:並べ替えの対象となる列
  //order:1=昇順、-1=降順
  arrs.sort(function (a, b) {
    return (a[col] - b[col]) * order;
  });
  return arrs;
}

window.onload = function () {
  // 初期設定
  init();
};

function sortNum(arr) {
  function bcmp(v1, v2) {
    return arr[v1] - arr[v2];
  }
  return arr.sort(bcmp);
}

const transpose = (a) => a[0].map((_, c) => a.map((r) => r[c]));

function addIndex(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i].push(i);
  }
  return arr;
}

function distance(a, b) {
  return Math.sqrt(a * a + b * b);
}

function sum(arr) {
  return arr.reduce(function (prev, current, i, arr) {
    return prev + current;
  });
}

function catch_prob(x1, y1, x2, y2) {
  dis = Math.round(distance(x2 - x1, y2 - y1));
  if (dis > CATCH_PROBABILITY_LIST.length - 1) {
    return 0;
  }
  return CATCH_PROBABILITY_LIST[dis];
}

function prob_judge(prob) {
  if (Math.random() < prob) {
    return 1;
  } else {
    return 0;
  }
}

function dis_defense_arr_func(pos, x, y) {
  dis_defense_arr = [];
  for (let j = 0; j < pos[0].length; j++) {
    dis_defense_arr.push(distance(x - pos[0][j][0], y - pos[0][j][1]));
  }
  return dis_defense_arr;
}

function dis_attack_arr_func(pos, x, y) {
  dis_defense_arr = [];
  for (let j = 0; j < pos[0].length; j++) {
    dis_defense_arr.push(distance(x - pos[1][j][0], y - pos[1][j][1]));
  }
  return dis_defense_arr;
}

function check_func(dis_defense_arr) {
  for (let j = 0; j < dis_defense_arr.length; j++) {
    if (dis_defense_arr[j] < 2) {
      return 1;
    }
  }
  return 0;
}

function try_catch(ball, catcher, x1, y1, x2, y2, wait) {
  if (prob_judge(catch_prob(x1, y1, x2, y2))) {
    const passElement = document.getElementById("pass");
    if (passElement) {
      passElement.innerHTML = "パス成功！";
    }
  } else {
    wait = catcher;
    const passElement = document.getElementById("pass");
    if (passElement) {
      passElement.innerHTML = "パス失敗！";
    }
  }
  return wait;
}

function save() {
  const txt = editor.getValue();
  // 文字列をBlob化
  const blob = new Blob([txt], { type: "text/plain" });

  // ダウンロード用のaタグ生成
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "AI.txt";
  a.click();
}

window.onerror = function (message, fileName, lineNumber, columnNumber, error) {
  document.getElementById("codeerror").innerHTML =
    lineNumber +
    "行目の" +
    columnNumber +
    "文字目でエラーが起こりました。エラー内容：" +
    message;
  const doc = editor.getDoc();
  const options = {
    css: "background-color:#ffcfcc", // styleを直接指定する場合
  };

  marker = doc.markText(
    { line: lineNumber - 1, ch: 0 },
    { line: lineNumber - 1, ch: 1000 },
    options
  );

  return true;
};

function clearError() {
  document.getElementById("codeerror").innerHTML = "";
  document.getElementById("poserror").innerHTML = "";
  editor.doc.getAllMarks().forEach((marker) => marker.clear());
}

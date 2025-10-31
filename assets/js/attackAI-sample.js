let eval_list = []; //評価値配列を生成
let step = game.step;
//
//移動の評価値計算
//
let movablelist = movablelistFunc(pos, turn, select, tagged); //移動の候補場所配列を作成
for (let i = 0; i < movablelist.length; i++) {
  //候補に移動場所に対して順番に評価値を調べる
  [
    //移動の評価値計算に使える要素
    distance_defense, //守り手までの距離（配列）
    distance_defense_min, //守り手までの最小距離
    back_forth_from_goalline, //ゴールラインに対する前後の移動距離（前は１、後ろはー１、横は０）
    horizontal_diff_from_ball, //ボールを持っているプレイヤーとの横方向の距離
    vertical_diff_from_ball, //ボールを持っているプレイヤーとの縦方向の距離
    defenseLine, //守り手の左からの順番を表した配列
    attackLine, //攻め手の左からの順番を表した配列
    deviation_from_uniform_position, //均等に横方向に並ぶ場合の場所からのずれ
    // ball // ballを持っているプレイヤーの番号
    // select // プレイヤーの番号
    // pos // 行動するプレイヤーの場所
  ] = getParamForMove(pos, ball, movablelist[i][0], movablelist[i][1], select);

  //最初にいったん下がって、そのあと前に行く。
  let backFirst = 0;
  if (step < 4) {
    backFirst = -10;
  } else {
    backFirst = 5;
  }

  //ボールを持っているときはできるだけ前に行く。それ以外の場合はボールを持っているプレイヤーに合わせる
  let goForwardOrBackward = 0;
  if (select == ball) {
    //ボールを持っている時
    goForwardOrBackward = 3;
  } else {
    //ボールを持っていない時
    if (vertical_diff_from_ball < 0) {
      //ボールを持っているプレイヤーが前にいるとき
      goForwardOrBackward = -100;
    } else {
      //ボールを持っているプレイヤーの後ろにいるとき
      goForwardOrBackward = 10 / (vertical_diff_from_ball + 1);
    }
  }
  eval_list.push(
    //移動の評価値の計算式をここに書く
    backFirst * back_forth_from_goalline +
      1 * distance_defense_min - //できるだけ守り手から離れる
      deviation_from_uniform_position + //できるだけ均等にばらつく
      goForwardOrBackward * back_forth_from_goalline + //ボールを持っているときはできるだけ前に行く。それ以外の場合はボールを持っているプレイヤーに合わせる
      0.1 * Math.random() //乱数
  );
}

//
//パスの評価値計算
//
let passlist = passlistFunc(pos, turn, select, ball); //パスの候補場所配列を作成
for (let i = 0; i < passlist.length; i++) {
  //パス場所に対して順番に評価値を調べる
  [
    distance_defense_throw_min, //ボールを持っているプレイヤーとディフェンスとの最短距離
    pass_distance, //パスの距離
    distance_defense_catch_min, //パスを受けるプレイヤーとディフェンスとの最短距離
  ] = getParamForThrow(pos, ball, i, passlist[i][0], passlist[i][1], select);

  //守り手が残り２手以下のところまでに近づいているときはパスをする
  let passBeforeTagged = 0;
  if (distance_defense_min <= 2) {
    //２手以下のところまでに近づいているとき
    passBeforeTagged = 20;
  } else {
    //まだ２手以内に守り手がいないとき
    passBeforeTagged = 0;
  }

  //守り手から大きく離れている位置のプレイヤーにパスをする
  let passForIsolatedPlayer = 0;
  if (
    distance_defense_catch_min >= 5 &&
    distance_defense_min < distance_defense_catch_min
  ) {
    //７手以上離れているとき
    passForIsolatedPlayer = 10;
  } else {
    passForIsolatedPlayer = 0;
  }

  eval_list.push(
    //パスの評価値の計算式をここに書く
    distance_defense_catch_min +
      passBeforeTagged + //守り手が残り２手以下のところまでに近づいているときはパスをする
      passForIsolatedPlayer +
      (3 - distance_defense_throw_min) +
      0.5 * pass_distance +
      0.1 * Math.random()
  );
}

//評価値が最大の場所と評価値配列を返す
return_arr = returnResult(
  movablelist,
  passlist,
  pos,
  turn,
  select,
  ball,
  eval_list
);

eval_list;
//
//移動の評価値計算
//
let movablelist = movablelistFunc(pos, turn, select, tagged); //移動の候補場所配列を作成
for (let i = 0; i < movablelist.length; i++) {
  //候補に移動場所に対して順番に評価値を調べる
  [
    distance_defense, //守り手までの距離（配列）
    distance_defense_min, //守り手までの最小距離
    back_forth_from_goalline, //ゴールラインに対する前後の移動距離（前は１、後ろはー１、横は０）
    horizontal_diff_from_ball, //ボールを持っているプレイヤーとの横方向の距離
    vertical_diff_from_ball, //ボールを持っているプレイヤーとの縦方向の距離
    defenseLine, //守り手の左からの順番を表した配列
    attackLine, //攻め手の左からの順番を表した配列
    deviation_from_uniform_position, //均等に横方向に並ぶ場合の場所からのずれ
  ] = getParamForMove(pos, ball, movablelist[i][0], movablelist[i][1], select);

  eval_list.push(
    //移動の評価値の計算式をここに書く
    0.1 * Math.random() // 乱数
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
    pass_distance, //パスが成功する確率
    distance_defense_catch_min, //パスを受けるプレイヤーとディフェンスとの最短距離
  ] = getParamForThrow(pos, ball, i, passlist[i][0], passlist[i][1], select);

  eval_list.push(
    //パスの評価値の計算式をここに書く
    distance_defense_catch_min +
      (3 - distance_defense_throw_min) -
      pass_distance +
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

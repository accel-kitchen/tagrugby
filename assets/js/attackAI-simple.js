//
//移動の評価値計算
//

if (step < 5) {
  move_score = 
    -15 * back_forth_from_goalline +  // 後退を重視（後退は+15、前進は-15）
    8 * distance_defense_min;        // 守り手から離れることを重視
} else {
  move_score = 
    -10 * back_forth_from_goalline +  // 後退を重視（後退は+10、前進は-10）
    5 * distance_defense_min;        // 守り手から離れることを重視
}

//
//パスの評価値計算
//

if (step < 5) {
  pass_score = 
    10 * distance_defense_throw_min;  // パスする側が守り手から離れていることを重視
} else {
  pass_score = 
    -4 * pass_distance;               // パス距離は短い方が良い
}


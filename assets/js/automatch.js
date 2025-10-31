/* --------------------------------------------------------------------------
 * Rugby AI automatch *
 * file           : automatch.js
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

rugby_AI.AIsample = function (pos, turn, select, ball, tagged) { //係数の設定
	//移動用
	let A = 1; //ゴールラインに対する前後の移動距離の係数
	let B = 1; //ディフェンスとの最短距離の係数
	let C = 1; //ボールを持っているプレイヤーとの縦の距離
	let D = 1; //ボールを持っているプレイヤーとの横の距離
	//パス用
	let G = -1; //パスの距離の係数
	let E = 1; //ボールを持っているプレイヤーとディフェンスとの最短距離の係数
	let F = 1; //パスを受けるプレイヤーとディフェンスとの最短距離の係数
	//変数の設定
	let forward_param;
	let eval_list = [];
	let action_list = [];
	let movablelist = movablelistFunc(pos, turn, select, tagged);
	let passlist = passlistFunc(pos, turn, select, ball);
	action_list = action_list.concat(movablelist);
	action_list = action_list.concat(passlist);
	[checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball);
	//トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag == 1) {
		return_arr = [
			[x, y], eval_list
		];
	}
	//アタックの場合：まずはボールを投げるべきかどうかを判断する。投げない場合はボールを持っている場合と持っていない場合とでわける
	//ボールを投げる場所の評価は自分と近いディフェンスとの距離、投げる相手とディフェンスとの距離、自分の水平方向の真ん中からの距離、投げる相手の水平方向の真ん中からの距離、パスが成功する確率のパラメータを調整して決める

	//移動の評価値計算
	for (let i = 0; i < movablelist.length; i++) {
		distance_defense = dis_defense_arr_func(pos, movablelist[i][0], movablelist[i][1]); //ディフェンスとの距離リスト
		distance_defense_min = Math.min.apply(null, distance_defense); //ディフェンスとの最小距離
		back_forth_from_goalline = -(movablelist[i][1] - pos[1][select][1]); //ゴールラインに対する前後の移動距離
		[horizontal_diff_from_ball, vertical_diff_from_ball] = difffromhBallFunc(pos, ball, select, movablelist[i][0], movablelist[i][1]);
		[defenseLine, attackLine] = PosSortTraverse(pos); //defenseLine,attackLineはそれぞれ左からエージェントのIDをリストにしたもの。
		//			if ( distance_defense_min < 2 ){
		//				eval_list.push(-100);
		//			}	//次のトライされるようなケースはできるだけ避ける
		//			else{
		//			}
		eval_list.push(
			A * back_forth_from_goalline +
			B * distance_defense_min +
			C * vertical_diff_from_ball +
			D * horizontal_diff_from_ball +
			0.1 * Math.random()
		);

	}
	//パスの評価値計算
	for (let i = 0; i < passlist.length; i++) {
		distance_defense_throw_min = Math.min.apply(null, dis_defense_arr_func(pos, pos[1][select][0], pos[1][select][1])); //ボールを持っているプレイヤーとディフェンスとの最短距離
		pass_distance = distance(pos[1][i][0] - pos[1][select][0], pos[1][i][1] - pos[1][select][1]); //パスが成功する確率
		distance_defense_catch_min = Math.min.apply(null, dis_defense_arr_func(pos, passlist[i][0], passlist[i][1])); //パスを受けるプレイヤーとディフェンスとの最短距離
		eval_list.push(
			E * distance_defense_throw_min +
			G * pass_distance +
			F * distance_defense_catch_min +
			0.1 * Math.random()
		);
	}


	best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list));
	best_move_array = [action_list[best_move_index][0], action_list[best_move_index][1]];
	return_arr = [best_move_array, eval_list];
	return return_arr;
};

rugby_AI.AttackAI = function (pos, turn, select, ball, tagged) {
	let return_arr;
	eval(editor.getValue());
	return return_arr;
};

// sample1：ランダムに行動する
rugby_AI.AttackSample1 = function (pos, turn, select, ball, tagged) {
	let eval_list = []; //評価値リストの初期化
	let movablelist = movablelistFunc(pos, turn, select, tagged); //動ける場所のリスト,this.taggedを作成

	[checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball); //checkmateFlagはトライorインターセプトできるかのフラグ、x,yがその場合の動く先
	//トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag) {
		return [
			[x, y], eval_list
		];
	}

	//動ける候補にそれぞれ評価値をつける
	for (let i = 0; i < movablelist.length; i++) {
		eval_list.push(Math.random()); //評価値は0~1のランダム
	}

	best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list)); //評価値が最も大きい候補の番号を得る
	best_move_array = [
		movablelist[best_move_index][0],
		movablelist[best_move_index][1]
	]; //評価値が最も大きい候補の動く場所を返す

	return [best_move_array, eval_list]; //結果を返す
};

rugby_AI.DefenseSample1 = function (pos, turn, select, ball, tagged) {
	let eval_list = []; //評価値リストの初期化
	let movablelist = movablelistFunc(pos, turn, select, tagged); //動ける場所のリスト,this.taggedを作成

	[checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball); //checkmateFlagはトライorインターセプトできるかのフラグ、x,yがその場合の動く先
	//トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag) {
		return [
			[x, y], eval_list
		];
	}

	//動ける候補にそれぞれ評価値をつける
	for (let i = 0; i < movablelist.length; i++) {
		eval_list.push(Math.random()); //評価値は0~1のランダム
	}

	best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list)); //評価値が最も大きい候補の番号を得る
	best_move_array = [
		movablelist[best_move_index][0],
		movablelist[best_move_index][1]
	]; //評価値が最も大きい候補の動く場所を返す

	return [best_move_array, eval_list]; //結果を返す
};
// sample2
rugby_AI.AttackSample2 = function (pos, turn, select, ball, tagged) {
	let eval_list = []; //評価値リストの初期化
	let movablelist = movablelistFunc(pos, turn, select, tagged); //動ける場所のリスト,this.taggedを作成

	[checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball); //checkmateFlagはトライorインターセプトできるかのフラグ、x,yがその場合の動く先
	//トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag) {
		return [
			[x, y], eval_list
		];
	}

	//アタックの場合：インターセプトを次のターンまでにされる距離（距離が2未満）の場合は評価値-100、それ以外はforward_factorの重要度で前に行くことを優先し、ディフェンス全てとの距離の合計を小さくするように動く
	forward_factor = 10; //どのぐらい前に行くことを優先するかのパラメータ
	dis_defense = [];

	for (let i = 0; i < movablelist.length; i++) {
		dis_defense = dis_defense_arr_func(
			pos,
			movablelist[i][0],
			movablelist[i][1]
		); //dis_defense（ディフェンスとの距離のリストを取得）
		if (check_func(dis_defense)) {
			//インターセプトを次のターンまでにされる場合
			eval_list.push(-100);
		} else {
			//インターセプトが次のターンに起こらない場合
			dis_defense_sum = sum(dis_defense);
			eval_list.push(
				-1 * forward_factor * (movablelist[i][1] - pos[1][select][1]) +
				dis_defense_sum +
				0.1 * Math.random()
			);
		}
	}
	best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list)); //評価値が最も大きい候補の番号を得る
	best_move_array = [
		movablelist[best_move_index][0],
		movablelist[best_move_index][1]
	]; //評価値が最も大きい候補の動く場所を返す

	return [best_move_array, eval_list]; //結果を返す
};

rugby_AI.DefenseSample2 = function (pos, turn, select, ball, tagged) {
	let eval_list = []; //評価値リストの初期化
	let movablelist = movablelistFunc(pos, turn, select, tagged); //動ける場所のリスト,this.taggedを作成

	[checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball); //checkmateFlagはトライorインターセプトできるかのフラグ、x,yがその場合の動く先
	//トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag) {
		return [
			[x, y], eval_list
		];
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
		movablelist[best_move_index][1]
	]; //評価値が最も大きい候補の動く場所を返す

	return [best_move_array, eval_list]; //結果を返す
};

// sample3
rugby_AI.AttackSample3 = function (pos, turn, select, ball, tagged) {
	let forward_param;
	let eval_list = [];
	let movablelist = movablelistFunc(pos, turn, select, tagged);
	[checkmateFlag, this.tagged, x, y] = CheckMateFunc(pos, turn, select, ball);

	//トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag == 1) {
		return [
			[x, y], eval_list
		];
	}

	//アタックの場合：まずはボールを投げるべきかどうかを判断する。投げない場合はボールを持っている場合と持っていない場合と
	forward_factor = 10;
	pass_threshold = 3; //パスを考え始めるディフェンスとの最小距離
	if (select == ball) {
		//ボールを投げるか判断
		dis_attack = dis_attack_arr_func(pos, pos[1][select][0], pos[1][select][1]); //dis_attack（アタックとの距離のリストを取得）
		dis_defense_min = Math.min.apply(
			null,
			dis_defense_arr_func(pos, pos[1][select][0], pos[1][select][1])
		); //dis_defense（ディフェンスとの距離のリストを取得）
		for (let i = 0; i < pos[1].length; i++) {
			dis_defense_catch_min = Math.min.apply(
				null,
				dis_defense_arr_func(pos, pos[1][i][0], pos[1][i][1])
			); //キャッチするエージェントに最も近いディフェンスとの距離
			if (
				//ボールを投げるかどうかの判断
				i != select &&
				dis_defense_min < pass_threshold &&
				dis_defense_catch_min - dis_defense_min > 1 &&
				pos[1][select][1] <= pos[1][i][1] &&
				Math.random() <
				catch_prob(
					pos[1][i][0],
					pos[1][i][1],
					pos[1][select][0],
					pos[1][select][1]
				)
			) {
				return [
					[pos[1][i][0], pos[1][i][1]], eval_list
				];
			}
		}
	}

	//ボールを投げない場合
	for (let i = 0; i < movablelist.length; i++) {
		dis_defense = dis_defense_arr_func(
			pos,
			movablelist[i][0],
			movablelist[i][1]
		); //dis_defense（ディフェンスとの距離のリストを取得）
		if (check_func(dis_defense)) {
			//インターセプトを次のターンまでにされる場合
			eval_list.push(-100);
		} else {
			if (ball == select) {
				//ボールを持っている場合はできるだけ前に行くようにする
				forward_param = -1 * (movablelist[i][1] - pos[1][select][1]);
			} else {
				//ボールを持っていない場合はボールを持っている人と同じラインに並ぼうとする。
				forward_param = -1 * Math.abs(pos[1][ball][1] - movablelist[i][1]);
			}
			dis_defense_sum = sum(dis_defense);
			eval_list.push(
				forward_factor * forward_param +
				0.1 * dis_defense_sum +
				0.1 * Math.random()
			);
		}
	}

	best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list));
	best_move_array = [
		movablelist[best_move_index][0],
		movablelist[best_move_index][1]
	];

	return [best_move_array, eval_list];
};

rugby_AI.DefenseSample3 = function (pos, turn, select, ball, tagged) {
	let forward_param;
	let eval_list = [];
	let movablelist = movablelistFunc(pos, turn, select, tagged);
	[checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball);

	//トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag == 1) {
		return [
			[x, y], eval_list
		];
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
		movablelist[best_move_index][1]
	];

	return [best_move_array, eval_list];
};

// sample4
rugby_AI.AttackSample4 = function (pos, turn, select, ball, tagged) {
	let forward_param;
	let eval_list = [];
	let movablelist = movablelistFunc(pos, turn, select, tagged);
	[checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball);

	//トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag == 1) {
		return [
			[x, y], eval_list
		];
	}

	//アタックの場合：まずはボールを投げるべきかどうかを判断する。投げない場合はボールを持っている場合と持っていない場合とでわける
	//ボールを投げる場所の評価は自分と近いディフェンスとの距離、投げる相手とディフェンスとの距離、自分の水平方向の真ん中からの距離、投げる相手の水平方向の真ん中からの距離、パスが成功する確率のパラメータを調整して決める
	forward_factor = 10; //前に進むことに対する係数
	prob_factor = 1; //パスが成功する確率の係数
	even_factor = 100; //ボールを持っていないときに均等に並ぼうとする係数
	center_factor = 1; //真ん中にパスを回すことに対する係数
	pass_threshold = 2; //パスを考え始めるディフェンスとの最小距離
	base_line = 1; //ボールを持っていない場合はボールを持っている人とbase_lineだけ低いラインに並ぼうとする。
	dis_defense_factor = 0.1; //ディフェンスとの最小合計をどれだけ小さくするかに対する係数
	dis_defense_catch_factor = 3; //ディフェンスとの最短距離がどれだけ小さくするかに対する投げるときの係数

	[defenseLine, attackLine] = PosSortTraverse(pos); //defenseLine,attackLineはそれぞれ左からエージェントのIDをリストにしたもの。

	dis_defense_min = Math.min.apply(
		null,
		dis_defense_arr_func(pos, pos[1][select][0], pos[1][select][1])
	); //dis_defense　ディフェンスとの最小距離
	if (select == ball) {
		//ボールを投げるか判断
		catch_candidate = []; //投げる相手の候補リスト
		catch_eval_list = []; //投げる相手の評価値のリスト
		dis_attack = dis_attack_arr_func(pos, pos[1][select][0], pos[1][select][1]); //dis_attack（アタックとの距離のリストを取得）

		for (let i = 0; i < pos[1].length; i++) {
			dis_defense_catch_min = Math.min.apply(
				null,
				dis_defense_arr_func(pos, pos[1][i][0], pos[1][i][1])
			); //キャッチするエージェントに最も近いディフェンスとの距離
			if (
				i != select &&
				dis_defense_min < pass_threshold &&
				dis_defense_catch_min - dis_defense_min >= 0 &&
				pos[1][select][1] <= pos[1][i][1] &&
				Math.random() <
				catch_prob(
					pos[1][i][0],
					pos[1][i][1],
					pos[1][select][0],
					pos[1][select][1]
				)
			) {
				catch_candidate.push([pos[1][i][0], pos[1][i][1]]); //投げる候補の追加
				catch_eval_list.push(
					prob_factor *
					catch_prob(
						pos[1][i][0],
						pos[1][i][1],
						pos[1][select][0],
						pos[1][select][1]
					) +
					center_factor *
					Math.abs(
						pos[1][i][0] -
						BOARDSIZE / 2 +
						dis_defense_factor * dis_defense_catch_min
					)
				); //投げる評価値の追加
			}
		}
		if (catch_candidate.length != 0) {
			best_catch_index = catch_eval_list.indexOf(
				Math.max.apply(null, catch_eval_list)
			);
			best_catch_array = [
				catch_candidate[best_catch_index][0],
				catch_candidate[best_catch_index][1]
			];
			return [catch_candidate[best_catch_index], eval_list];
		}
	}

	//ボールを投げない場合

	for (let i = 0; i < movablelist.length; i++) {
		dis_defense = dis_defense_arr_func(
			pos,
			movablelist[i][0],
			movablelist[i][1]
		); //dis_defense（ディフェンスとの距離のリストを取得）
		dis_defense_min_next = Math.min.apply(null, dis_defense); //dis_defense　ディフェンスとの最小距離
		if (check_func(dis_defense)) {
			//インターセプトを次のターンまでにされる場合
			eval_list.push(-100);
		} else {
			if (ball == select) {
				//ボールを持っている場合はできるだけ前に行くようにする
				forward_param = -1 * (movablelist[i][1] - pos[1][select][1]);
				even_param = 0;
			} else {
				//ボールを持っていない場合はボールを持っている人とbase_lineだけ低いラインに並ぼうとする。
				if (movablelist[i][1] < pos[1][ball][1]) {
					forward_param = -10 * (pos[1][ball][1] - movablelist[i][1]);
				} else {
					forward_param = -1 * Math.abs(pos[1][ball][1] - movablelist[i][1] + base_line) +
						0.1 * (movablelist[i][1] - pos[1][ball][1]);
					even_param = -1 *
						Math.abs(
							(attackLine[select] / (pos[1].length - 1)) * BOARDSIZE -
							movablelist[i][0]
						);
				}
			}
			eval_list.push(
				forward_factor * forward_param +
				dis_defense_factor * dis_defense_min_next +
				even_factor * even_param +
				0.1 * Math.random()
			);
		}
	}

	best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list));
	best_move_array = [
		movablelist[best_move_index][0],
		movablelist[best_move_index][1]
	];

	return [best_move_array, eval_list];
};

rugby_AI.AttackSample5 = function (pos, turn, select, ball, tagged) {
	let eval_list = [];
	let action_list = [];
	let movablelist = movablelistFunc(pos, turn, select, tagged);
	let passlist = passlistFunc(pos, turn, select, ball);
	action_list = action_list.concat(movablelist);
	action_list = action_list.concat(passlist);
	[checkmateFlag, x, y] = CheckMateFunc(pos, turn, select, ball);

	//トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag == 1) {
		return [
			[x, y], eval_list
		];
	}

	//アタックの場合：まずはボールを投げるべきかどうかを判断する。投げない場合はボールを持っている場合と持っていない場合とでわける
	//ボールを投げる場所の評価は自分と近いディフェンスとの距離、投げる相手とディフェンスとの距離、自分の水平方向の真ん中からの距離、投げる相手の水平方向の真ん中からの距離、パスが成功する確率のパラメータを調整して決める

	//係数の設定
	//パス用
	catch_probability_factor = 0.01; //パスが成功する確率の係数
	deviation_from_center_factor = 0.5; //中心からの横方向の距離の係数
	distance_defense_throw_min_factor = -0.5; //ボールを持っているプレイヤーとディフェンスとの最短距離の係数
	distance_defense_catch_min_factor = 2; //パスを受けるプレイヤーとディフェンスとの最短距離の係数

	//移動用
	distance_defense_min_factor = 1.5; //ボールを持っているプレイヤーとディフェンスとの最短距離の係数
	forth_from_ball_factor = -100; //ボールを持っているプレイヤーとの前後の距離( ボールをもっているときは０）の係数（前の場合）
	back_from_ball_factor = 0.5; //ボールを持っているプレイヤーとの前後の距離( ボールをもっているときは０）の係数（後ろの場合）
	back_forth_from_goalline_factor = 4; //ゴールラインに対する前後の移動距離の係数
	deviation_from_uniform_position_factor = 3; //均等に横方向に並ぶ場合の場所からのずれの係数

	//移動の評価値計算
	for (let i = 0; i < movablelist.length; i++) {
		distance_defense = dis_defense_arr_func(
			pos,
			movablelist[i][0],
			movablelist[i][1]
		); //ディフェンスとの距離リスト
		distance_defense_min = Math.min.apply(null, distance_defense); //ディフェンスとの最小距離
		back_forth_from_goalline = -(movablelist[i][1] - pos[1][select][1]); //ゴールラインに対する前後の移動距離
		[forth_from_ball, back_from_ball] = backforthBallFunc(
			pos,
			ball,
			select,
			movablelist[i][1]
		);

		[defenseLine, attackLine] = PosSortTraverse(pos); //defenseLine,attackLineはそれぞれ左からエージェントのIDをリストにしたもの。
		deviation_from_uniform_position = -Math.abs(
			(attackLine[select] / (pos[1].length - 1)) * BOARDSIZE - movablelist[i][0]
		); //均等に横方向に並ぶ場合の場所からのずれ
		eval_list.push(
			distance_defense_min_factor * distance_defense_min +
			back_forth_from_goalline_factor * back_forth_from_goalline +
			forth_from_ball_factor * forth_from_ball +
			back_from_ball_factor * back_from_ball +
			deviation_from_uniform_position_factor *
			deviation_from_uniform_position +
			0.1 * Math.random()
		);
	}

	//パスの評価値計算
	for (let i = 0; i < passlist.length; i++) {
		distance_defense_throw_min = Math.min.apply(
			null,
			dis_defense_arr_func(pos, pos[1][select][0], pos[1][select][1])
		); //ボールを持っているプレイヤーとディフェンスとの最短距離
		catch_probability = catch_prob(
			pos[1][i][0],
			pos[1][i][1],
			pos[1][select][0],
			pos[1][select][1]
		); //パスが成功する確率
		distance_defense_catch_min = Math.min.apply(
			null,
			dis_defense_arr_func(pos, passlist[i][0], passlist[i][1])
		); //パスを受けるプレイヤーとディフェンスとの最短距離
		deviation_from_center = Math.abs(passlist[i][0] - BOARDSIZE / 2); //中心からの横方向の距離
		eval_list.push(
			distance_defense_throw_min_factor * distance_defense_throw_min +
			catch_probability_factor * catch_probability +
			distance_defense_catch_min_factor * distance_defense_catch_min +
			deviation_from_center_factor * deviation_from_center +
			0.1 * Math.random()
		);
	}

	best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list));
	best_move_array = [
		action_list[best_move_index][0],
		action_list[best_move_index][1]
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
//----------------------------------------
//ディフェンスとアタックのそれぞれ左から右に向かってどのプレイヤーが並んでいるかの配列を返す
//----------------------------------------
function PosSortTraverse(pos) {
	sort = [
		[],
		[]
	];
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

//----------------------------------------
//----------------------------------------
// パラメータの設定
//----------------------------------------
//----------------------------------------

//定数
let BOARDSIZE = 20;
let BLOCKSIZE = 30; // １マスのサイズ
let CANVASSIZE = 600; // ボードのサイズ
const NUMSIZE = 20; // ボード横の番号幅
let ANALYSISSIZE = 20; //解析結果の数字の大きさ
const boardWordHor = new Array(
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
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
	"M",
	"N",
	"O",
	"P",
	"Q",
	"V",
	"W",
	"X"
);

let MAXTAG = 4; //この回数タグをとられるとアタックの負け。
const CATCH_PROBABILITY_LIST = [1, 1, 1, 1, 1, 0.8, 0.8, 0.6, 0.6, 0.4, 0.4]; //キャッチできる確率
const MAX_PASS_LENGTH = CATCH_PROBABILITY_LIST.length - 1; //ボールが投げられる最大距離
//変数
let DELAYDURATION = 100; // 打ってから反映するまでの時間
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

//色
BOARDCOLOR = "#f4f8ff";
ATTACKFILLCOLOR = "#000000";
ATTACKBORDERCOLOR = "#000000";
DEFENSEFILLCOLOR = "#ffffff";
DEFENSEBORDERCOLOR = "#000000";
BOARDERCOLOR = "#3f3f3f";
BACKGROUNDCOLOR = "#ffffff";
FONTCOLOR = "#3f3f3f";
ANAMOVEFONTCOLOR = "#3f3f3f";
ANAPASSFONTCOLOR = "#ffffff";
INGOALCOLOR = "#e5edfc";
BALLCOLOR = "#c65353";
SELECTDISC = "#3f3f3f";
FINALDISC = "#c65353";
//ディフェンスの位置の初期設定
let POSDEFENSE = [
	[2, 8], //1人目
	[4, 7], //2人目
	[8, 5], //3人目
	[13, 6], //4人目
	[11, 8] //5人目
];

//アタックの位置の初期設定
let POSATTACK = [
	[4, 9], //1人目
	[6, 11], //2人目
	[10, 10], //3人目
	[13, 9], //4人目
	[15, 6] //5人目
];

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
		this.pass = 0; //パス（直前がパスの時は1、それ以外は0）
		// コマの位置の初期化
		this.pos = [];
		eval(AI1 + "pos()");
		this.pos[0] = POSDEFENSE.copy();
		this.pos[1] = POSATTACK.copy();
		this.select = 0;
		this.ball = 0;
		this.tag = MAXTAG;
		this.nextmove = []; //次の一手の配列
		this.eval_list = []; //評価値リストの配列
		this.wait = -1;
		this.tagged = 0;
	}

	AIturn(AInum) {

		//AIの思考
		let AI_name = game[AInum].Role[arrayTurn(this.turn)]; //AIの名前を
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
		try {

			[nextmove, eval_list] = rugby_AI[AI_name](
				this.pos,
				this.turn,
				this.select,
				this.ball,
				this.tagged
			); //AIの呼び出し、盤面から最善手及びそれぞれの評価値を返す
		} catch (err) {
			console.log("pass", err);
		}
		if (nextmove == [] || typeof nextmove[0] === "undefined" || typeof nextmove[1] === "undefined") {
			[this.select, this.turn, this.tagged] = stepPhaseFunc(this.select, this.pos, this.turn, this.ball, this.tagged);
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
				gameOver(-1, nextmove[0], nextmove[1], AInum);
				return;
			} else {
				this.tag -= 1;
				this.tagged = 1;
				this.tagged_disp = 1;
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
					gameOver(1, x, y, AInum);
					return;
				}
			}
		}
		if (this.Role[arrayTurn(this.turn)] != "human") {
			AIthinkFlag = 1;
			setTimeout("game[" + AInum + "].AIturn(" + AInum + ")", DELAYDURATION);
		}
		AIthinkFlag = 0;
		draw(ctx[AInum], canvas[AInum], game[AInum]);
	}
}
//----------------------------------------
// tagJudgeFunc tagがとられたか判定
//----------------------------------------
function tagJudgeFunc(select, pos, turn, ball, x, y) {
	if (
		Math.abs(pos[arrayTurn(turn)][select][0] - x) <= 1 &&
		Math.abs(pos[arrayTurn(turn)][select][1] - y) <= 1 && [x, y] != pos[arrayTurn(turn)][select]
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
	if (turn == -1) {
		if (select == pos[arrayTurn(turn)].length - 1) {
			select = 0;
		} else {
			select += 1;
		}
	}
	tagged = 0;
	turn *= -1;
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
					pos[arrayTurn(turn)][select][1] + j
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
						pos[arrayTurn(turn)][select][1] + j
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
	boardarea = document.getElementsByClassName('boardarea');
	for (let i = 0; i < AINameList.length; i++) {
		canvas[i].setAttribute("width", boardarea[0].clientWidth * 0.8);
		canvas[i].setAttribute("height", boardarea[0].clientWidth * 0.8);
		if (!canvas[i] || !canvas[i].getContext) {
			return false;
		}
		ctx[i] = canvas[i].getContext("2d"); // contextを取得する
		CANVASSIZE = canvas[i].clientWidth - NUMSIZE - 1;
		BLOCKSIZE = CANVASSIZE / BOARDSIZE;
		ANALYSISSIZE = 0.5 * BLOCKSIZE;
		draw(ctx[i], canvas[i], game[i]);
	}
}

//----------------------------------------
// 初期化
//----------------------------------------
function init() {
	console.log("AIName", AINameList);
	canvas = [];
	game = [];
	ctx = [];
	for (let i = 0; i < AINameList.length; i++) {

		canvas[i] = document.getElementById(AINameList[i]);
		game[i] = new Game(AINameList[i], "DefenseSample3");
		ctx[i] = canvas[i].getContext("2d"); // contextを取得する

		// 初期描画
		draw(ctx[i], canvas[i], game[i]);

		//パラメータの初期化
		gameEndFlag = 0;
	}
	// キャンバスの設定
	window.addEventListener("resize", canvas_resize, false);
	canvas_resize();

}

//----------------------------------------
// 初期盤面からゲームをやり直し
//----------------------------------------
function rematch(AInum) {
	AIthinkFlag = 0;
	game[AInum].init(AINameList[AInum], "DefenseSample3");
	console.log("rematch", POSDEFENSE, POSATTACK);
	draw(ctx[AInum], canvas[AInum], game[AInum]);
	game[AInum].AIturn(AInum);
}
//----------------------------------------
// 一斉対戦スタート
//----------------------------------------
function allmatch() {
	//	ゲームスピードを設定する
	game_speed = document.ControlForm.game_speed.value;
	if (game_speed == 0) { //低速
		DELAYDURATION = 1000;
		ENDDURATION = 1000;
	} else if (game_speed == 1) { //高速
		DELAYDURATION = 100;
		ENDDURATION = 1000;
	} else { //超高速
		DELAYDURATION = 0;
		ENDDURATION = 1000;
	}
	for (let i = 0; i < AINameList.length; i++) {
		game[i].AIturn(i);
	}
}
//----------------------------------------
// コンフィグ設定ボタンをおした時の動作
//----------------------------------------
function config() {
	BOARDSIZE = parseInt(document.ConfigForm.boardsize.value);
	attack_num = parseInt(document.ConfigForm.attackNum.value);
	defense_num = parseInt(document.ConfigForm.defenseNum.value);
	MAXTAG = parseInt(document.ConfigForm.tag_num.value);
	POSATTACK = [];
	POSDEFENSE = [];
	//初期配置を読み込み
	eval(pos_editor.getValue());
	POSATTACK = POSATTACK.slice(0, attack_num);
	POSDEFENSE = POSDEFENSE.slice(0, defense_num);
	init();
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
	document.getElementById("tag").innerHTML = MAXTAG;

	//	アタック番とディフェンス番の思考を読み込む
	Role[2] = document.ControlForm.ana_role.value;
	Role[1] = document.ControlForm.attack_role.value;
	Role[0] = document.ControlForm.defense_role.value;
	game.Role[0] = Role[0];
	game.Role[1] = Role[1];
	//	ゲームスピードを設定する
	game_speed = document.ControlForm.game_speed.value;
	if (game_speed == 0) {
		//低速
		DELAYDURATION = 1000;
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
function gameOver(result_Diff, x, y, AInum) {
	gameEndFlag = 1; //ゲーム終了フラグをtrueにする。
	drawFinalDisc(ctx[AInum], canvas[AInum], x, y);
	//勝敗の判定
	if (result_Diff == 1) {
		attack_win_num = parseInt(document.getElementById('attack_win_num' + AInum).innerHTML);
		document.getElementById('attack_win_num' + AInum).innerHTML = attack_win_num + 1;
		//アタック勝ち
	} else if (result_Diff == -1) {
		defense_win_num = parseInt(document.getElementById('attack_win_num' + AInum).innerHTML);
		document.getElementById('defense_win_num' + AInum).innerHTML = defense_win_num + 1;
		//ディフェンス勝ち
	}

	//CPU同士の対決の場合は自動的に次の対局を開始
	setTimeout("rematch(" + AInum + ")", ENDDURATION);
}

//----------------------------------------
// マウスの移動
//----------------------------------------
function moveMouse(event) {
	// マウス座標の取得
	if (event) {
		mouseX = event.pageX - canvas.offsetLeft;
		mouseY = event.pageY - canvas.offsetTop;
	} else {
		mouseX = event.offsetX;
		mouseY = event.offsetY;
	}

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
	ctx.fillStyle = FINALDISC;
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

function draw(ctx, canvas, game) {
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
	ctx.beginPath();
	ctx.fillStyle = BALLCOLOR;
	ctx.arc(
		game.pos[1][game.ball][0] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
		game.pos[1][game.ball][1] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
		(BLOCKSIZE / 2) * 0.4,
		0,
		2 * Math.PI,
		false
	);
	ctx.fill();
	ctx.stroke();

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
	if (game.wait != -1) {
		ctx.fillText(
			"パス失敗のため１回休み",
			game.pos[1][game.wait][0] * BLOCKSIZE +
			~~(BLOCKSIZE * 0.5) +
			NUMSIZE +
			0.5,
			game.pos[1][game.wait][1] * BLOCKSIZE +
			~~(BLOCKSIZE * 0.5) +
			NUMSIZE +
			0.5
		);
	}
	//タグを取られた場合は表示
	if (game.tagged == 1) {
		ctx.fillText(
			"タグを取られたので、ボールを投げる",
			game.pos[1][game.ball][0] * BLOCKSIZE +
			~~(BLOCKSIZE * 0.5) +
			NUMSIZE +
			0.5,
			game.pos[1][game.ball][1] * BLOCKSIZE +
			~~(BLOCKSIZE * 0.5) +
			NUMSIZE +
			0.5
		);
	}
}

//----------------------------------------
// 評価値を返す
//----------------------------------------
function analysis() {
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
	Role[2] = document.ControlForm.ana_role.value;
	AI_name = Role[2];

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
		let i = movablelist.length; i < movablelist.length + passlist.length; i++
	) {
		ctx.fillText(
			Math.floor(eval_list[i]),
			action_list[i][0] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5,
			action_list[i][1] * BLOCKSIZE + ~~(BLOCKSIZE * 0.5) + NUMSIZE + 0.5
		);
	}
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

const transpose = a => a[0].map((_, c) => a.map(r => r[c]));

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

	} else {
		wait = catcher;
	}
	return wait;
}
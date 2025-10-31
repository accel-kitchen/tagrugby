<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Tagrugby All Match</title>
<meta name="Description" content="" />
<meta name="Keywords"  content="" />
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css" integrity="sha384-PsH8R72JQ3SOdhVi3uxftmaW6Vc51MKb0q5P2rRUpPvrszuE4W1povHYgTpBfshb" crossorigin="anonymous">
<script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" integrity="sha384-vFJXuSJphROIrBnz7yo7oB41mKfc8JzQZiCq4NCceLEaO4IHwicKwpJf9c9IpFgh" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js" integrity="sha384-alpBpkh1PFOepccYVYDB4do5UnbKysX5WZXm3XxPqe5iKTfUKjNkCk9SaVuEZflJ" crossorigin="anonymous"></script>
<link rel="stylesheet" type="text/css" media="screen,print" href="assets/css/custom.css" />
<script type="text/javascript" src="assets/js/automatch.js"></script>
  <?php
foreach(glob('AI/{*}',GLOB_BRACE) as $file){
    if(is_file($file)){

        echo "<script type=text/javascript src=";
        echo $file;        
        echo "></script>";
    }
}
?>

</head>
<body>
<?php
if(isset($_GET["delete_file"])){
$delete_file = $_GET["delete_file"];
unlink($delete_file);
echo $delete_file."は削除されました。";
}
?>
 <div class="control shadow-sm">
<p>登録されたＡＩ</p>
<ul>
  <script>
  　AINameList = [];
  AIposList = [];
  </script>
  <?php
foreach(array_filter(glob('AI/{*.js}',GLOB_BRACE),'is_file') as $file){
    if(is_file($file)){
      $filetime = $file;
      $file = str_replace('AI/', '', $file);
      $file = str_replace('.js', '', $file);
        echo "<li><a  href=\"automatch.php?delete_file=".$filetime."\"  onclick=\"return confirm('".$file."を削除してもよろしいですか？')\">";

        echo $file;  
        echo "</a>&nbsp;&nbsp<span style =\"color:gray; font-size:70%\"> ";
        echo  date ("F d Y H:i:s.", filemtime($filetime));         
        echo "</span></li>";

        echo "  <script>AINameList.push(\"";
        echo $file;        
        echo "\");</script>";
    }
}
?>
</ul>
</div>

                <div class="control shadow-sm">
                        <form name="ControlForm">
                                <div class="form-row">
                                        <div class="form-group-sm col-sm-3">
                                                <label for="game_speed" class="col-form-label">速さ</label>
                                                <select name="game_speed" class="form-control">Choose
                                                        <option value="0">低速</option>
                                                        <option value="1">高速</option>
                                                        <option value="2">超高速</option>
                                                </select>
                                        </div>
                                        <div class="form-group-sm col-sm-3 config-submit">
                                                <button type="button" class="btn btn-primary" onclick="allmatch()">開始</button>
                                        </div>
                                </div>
                        </form>
                </div>
                <div class="row">
<?php
$i =0;
foreach(array_filter(glob('AI/{*.js}',GLOB_BRACE),'is_file') as $file){
    if(is_file($file)){
      $filetime = $file;
      $file = str_replace('AI/', '', $file);
      $file = str_replace('.js', '', $file);
      echo "<div class=\"col-sm-6 boardarea\" ><h5>$file</h5><div class=\"row status\"><div class=\"param col-sm-4 name\">アタック勝利数：</div><div class=\"param col-sm-1 data\" id=\"attack_win_num".$i."\">0</div><div class=\"param col-sm-4 name\">ディフェンス勝利数：</div><div class=\"param col-sm-1 data\" id=\"defense_win_num".$i."\">0</div></div>";
      echo "<div><canvas id=\"".$file."\"></canvas></div></div>";
      $i++;
    }
  }
?>
</div>
</body>
</html>

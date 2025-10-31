<?php
header('Content-Type: text/html; charset=UTF-8');
$AIcode =  $_POST["AIcode"];
$poscode =  $_POST["poscode"];
$filename = $_POST["filename"].'.js';
$posname = 'pos_'.$_POST["filename"];
echo $filename."が登録されました。<br>";
file_put_contents("./AI/".$filename, $AIcode);
file_put_contents("./AI/".$posname, $poscode);
header("Location:automatch.php");
?>
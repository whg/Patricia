<?php

$filename = time();
$folder = $_POST["folder"];
$filepath = "$folder/$filename.json";

file_put_contents($filepath, $_POST["data"]);
chmod($filepath, 0755);

echo($filepath);

if ($folder == "plots") {
    exec(dirname(__FILE__) . "/plot.py $filepath");
}
?>
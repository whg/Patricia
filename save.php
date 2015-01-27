<?php

$filename = time();
$filepath = "saves/$filename.json";

file_put_contents($filepath, $_POST["data"]);
chmod($filepath, 0755);

echo($filepath);

?>
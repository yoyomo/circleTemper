<?php

$target = "audio/upload/";
$target = $target . basename( $_FILES['uploaded']['name']) ;
$ok=1;

if(move_uploaded_file($_FILES['uploaded']['tmp_name'], $target)) {
  echo "The file ". basename( $_FILES['uploadedfile']['name']). " has been uploaded";
} else {
  echo "Uploading Error.";
}
?>
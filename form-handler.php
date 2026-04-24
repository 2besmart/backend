<?php

$name = $_POST['name'];
$visitator_email = $_POST['email'];
$subject = $_POST['subject'];
$message = $_POST['message'];

$email_from = 'info@gmail.com' ;

$email_subject = 'New Form Submission' ;

$email_body = "User Name: $name.\n".
                "User Email: $visitator_email.\n".
                "Subject: $subject.\n".   
                "User Message: $message.\n";
$to = 'raduloga2010@gmail.com';
$headers = "From: $email_from \r\n";
$headers. = "Reply-To: $visitator_email \r\n";

mail($to, $email_subject, $email_body, $headers)

header("Location: desprenoi.html");

?>
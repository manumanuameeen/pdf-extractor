const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // port 587 means secure is false
  auth: { 
    user: 'jerrykerry3806@gmail.com', 
    pass: 'pltcpdrszaxkausm' 
  }
});
transporter.sendMail({
  from: 'jerrykerry3806@gmail.com',
  to: 'jerrykerry3806@gmail.com',
  subject: 'Test Email',
  text: 'This is a test email.'
}).then(() => console.log('Email sent successfully'))
  .catch((err) => console.error('Error sending email:', err.message));

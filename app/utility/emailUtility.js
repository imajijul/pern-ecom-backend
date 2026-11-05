import nodemailer from 'nodemailer';

export const emailSend = async (emailTo, emailText, emailSub)=>{
    
    const transporter = nodemailer.createTransport({
        host:"smtp.gmail.com",
        port:25,
        secure:false,
        auth:{user:"sagorislam.cse@gmail.com", pass:"pzht zfwe ysvm ikbs"},
        tls:{rejectUnauthorized:false}
    })

    const mailOptions = {
        from: 'Ecommerce Solution <sagorislam@gmail.com>',
        to: emailTo,
        subject: emailSub,
        html: emailText
    }

    return transporter.sendMail(mailOptions);
}
import emailjs from "@emailjs/nodejs";

interface SendVerificationEmailParams {
    email: string;
    username: string;
    verificationCode: string;
}

export const sendRegistrationVerificationEmail = async ({
    email,
    username,
    verificationCode,
}: SendVerificationEmailParams): Promise<void> => {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_VERIFICATION_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (
        !serviceId ||
        !templateId ||
        !publicKey ||
        !privateKey
    ) {
        throw new Error(
            "EmailJS environment variables are not configured.",
        );
    }

    await emailjs.send(
        serviceId,
        templateId,
        {
            to_email: email,
            username,
            verification_code: verificationCode,
        },
        {
            publicKey,
            privateKey,
        },
    );
};
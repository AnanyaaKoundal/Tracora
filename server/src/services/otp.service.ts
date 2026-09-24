
export const sendOtp = async(email: string, phone: string)=>{

}

export async function verifyOtp({
    otp,
    userId,
    purpose,
  }: {
    otp: string;
    userId?: string;
    purpose?: string;
  }): Promise<boolean> {
    try {
        console.log("OTP: ", otp);
      if (!otp) return false;
  
      if (otp !== '123456') return false;
  
      return true;
    } catch (err) {
      console.error("OTP verification failed:", err);
      return false;
    }
  }
  
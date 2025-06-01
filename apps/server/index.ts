import app from "./src/app"
import Connect from "./src/config/db";

const PORT = 3000;

Connect().then(()=>{
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  }); 
})
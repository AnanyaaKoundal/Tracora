import app from "./src/app"
import Connect from "./src/config/db";
import {initializeKafka} from "@/config/kafka_init";

// initializeKafka();

const PORT = 5000;

Connect().then(()=>{
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  }); 
})


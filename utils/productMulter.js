const multer = require('multer');
const path = require('path');


let count = 111111111;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,path.join(__dirname,'..','public','productUploads')); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${count++}-${file.originalname}`);
  },
});


const upload = multer({ storage: storage });

module.exports = upload;
const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'raychandanikunal@gmail.com',
    pass: 'esrz duob oesi kckw' // You'll need to replace this with your Gmail App Password
  }
});

// Excel file path
const excelFilePath = path.join(__dirname, 'contact_submissions.xlsx');

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Read existing Excel file or create new one
    let workbook;
    try {
      workbook = XLSX.readFile(excelFilePath);
    } catch (error) {
      workbook = XLSX.utils.book_new();
    }

    // Get or create worksheet
    let worksheet = workbook.Sheets['Submissions'] || XLSX.utils.aoa_to_sheet([['Name', 'Email', 'Message', 'Date']]);
    
    // Add new row
    const newRow = [name, email, message, new Date().toISOString()];
    XLSX.utils.sheet_add_aoa(worksheet, [newRow], { origin: -1 });
    
    // Save to Excel file
    XLSX.writeFile(workbook, excelFilePath);

    // Send email notification
    await transporter.sendMail({
      from: 'raychandanikunal@gmail.com',
      to: 'raychandanikunal@gmail.com',
      subject: 'New Contact Form Submission',
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Failed to process submission' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
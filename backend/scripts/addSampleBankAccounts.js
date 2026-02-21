import mongoose from 'mongoose';
import AdminSettings from '../models/adminSettings.js';

// Connect to MongoDB (use production database)
mongoose.connect('mongodb://localhost:27017/jamz-prod', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addSampleBankAccounts() {
  try {
    console.log('Adding sample bank accounts...');

    // Get or create admin settings
    const settings = await AdminSettings.getSettings();

    // Sample bank accounts
    const sampleBankAccounts = [
      {
        type: 'bank',
        name: 'Jamz Fun NGN Account',
        isEnabled: true,
        currency: 'NGN',
        bankName: 'Guaranty Trust Bank',
        accountHolderName: 'Jamz Fun Limited',
        accountNumber: '0123456789',
        minimumAmount: 5000,
        additionalInfo: 'Include your username in the transfer description for faster processing'
      },
      {
        type: 'bank',
        name: 'Jamz Fun USD Account',
        isEnabled: true,
        currency: 'USD',
        bankName: 'Chase Bank',
        accountHolderName: 'Jamz Fun LLC',
        accountNumber: '1234567890',
        routingNumber: '021000021',
        minimumAmount: 10,
        additionalInfo: 'Wire transfers typically take 1-3 business days to process'
      },
      {
        type: 'bank',
        name: 'Jamz Fun AED Account',
        isEnabled: true,
        currency: 'AED',
        bankName: 'Emirates NBD',
        accountHolderName: 'Jamz Fun DMCC',
        accountNumber: 'AE070331234567890123456',
        iban: 'AE070331234567890123456',
        swiftCode: 'EBILAEAD',
        bankAddress: 'Dubai, United Arab Emirates',
        minimumAmount: 50,
        additionalInfo: 'International transfers may take 3-5 business days'
      }
    ];

    // Add sample bank accounts if they don't exist
    for (const bankAccount of sampleBankAccounts) {
      const existingAccount = settings.paymentMethods.find(
        method => method.type === 'bank' && 
                 method.currency === bankAccount.currency && 
                 method.name === bankAccount.name
      );

      if (!existingAccount) {
        settings.paymentMethods.push(bankAccount);
        console.log(`Added ${bankAccount.currency} bank account: ${bankAccount.name}`);
      } else {
        console.log(`${bankAccount.currency} bank account already exists: ${bankAccount.name}`);
      }
    }

    // Save the settings
    await settings.save();
    console.log('Sample bank accounts added successfully!');

    // Display current payment methods
    console.log('\nCurrent payment methods:');
    settings.paymentMethods.forEach((method, index) => {
      console.log(`${index + 1}. ${method.name} (${method.type}) - ${method.isEnabled ? 'Enabled' : 'Disabled'}`);
      if (method.type === 'bank') {
        console.log(`   Currency: ${method.currency}`);
        console.log(`   Bank: ${method.bankName}`);
        console.log(`   Account: ${method.accountNumber}`);
        console.log(`   Min Amount: ${method.minimumAmount}`);
      }
    });

  } catch (error) {
    console.error('Error adding sample bank accounts:', error);
  } finally {
    mongoose.connection.close();
  }
}

addSampleBankAccounts();

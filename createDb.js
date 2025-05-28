// simpleImport.js - Optimized for Docker environment
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Import the Question model that follows your existing schema
const Question = require('./db_structures/question');

// Docker-optimized paths
const DATASET_PATH = process.env.DATASET_PATH || '/app/dataset_resized';
const ALTERNATIVES_FILE = process.env.ALTERNATIVES_FILE || '/app/dataset_resized/alternative.js';
const PUBLIC_IMAGES_DIR = './public/images';
const BASE_IMAGE_URL = 'http://localhost:3000/images';

// MongoDB URL from environment variable
const MONGO_URL = process.env.MONGO_URL;

/**
 * Load alternative names from your alternative.js file
 * This function handles the file being in the mounted dataset directory
 */
function loadAlternativeNames() {
  try {
    console.log('📝 Loading alternative names from:', ALTERNATIVES_FILE);
    
    // Check if the alternatives file exists
    if (!fs.existsSync(ALTERNATIVES_FILE)) {
      console.log('⚠️ Alternative names file not found');
      console.log('💡 Expected location:', ALTERNATIVES_FILE);
      console.log('💡 Make sure alternative.js is in your dataset directory');
      console.log('💡 Proceeding without alternative names...');
      return {};
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(ALTERNATIVES_FILE, 'utf8');
    
    let alternatives;
    try {
      // Handle different file formats
      if (fileContent.includes('module.exports')) {
        // Create a temporary file to require it properly
        const tempFile = '/tmp/alternatives_temp.js';
        fs.writeFileSync(tempFile, fileContent);
        delete require.cache[tempFile]; // Clear cache
        alternatives = require(tempFile);
        fs.unlinkSync(tempFile); // Clean up temp file
      } else if (fileContent.trim().startsWith('{')) {
        // Try parsing as JSON
        alternatives = JSON.parse(fileContent);
      } else {
        console.log('⚠️ Alternative names file format not recognized');
        return {};
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse alternatives file:', parseError.message);
      return {};
    }
    
    const animeCount = Object.keys(alternatives).length;
    console.log(`✅ Successfully loaded alternatives for ${animeCount} anime`);
    return alternatives;
    
  } catch (error) {
    console.log('⚠️ Failed to load alternative names:', error.message);
    console.log('💡 The import will continue without alternative names');
    return {};
  }
}

/**
 * Ensure the public images directory exists for serving images
 */
function ensureImagesDirectory() {
  if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
    fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
    console.log('📁 Created public images directory:', PUBLIC_IMAGES_DIR);
  }
}

/**
 * Copy an image file to the public directory and return the web URL
 * This makes images accessible via your Express server
 */
function copyImageFile(sourcePath, animeName, characterSetName, imageFileName) {
  try {
    // Create safe filenames by removing special characters
    // This ensures URLs work properly in web browsers
    const safeAnimeName = animeName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeSetName = characterSetName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeImageName = imageFileName.replace(/[^a-zA-Z0-9.]/g, '_');
    
    // Create a unique filename: AnimeName_CharacterSet_ImageName
    const publicFileName = `${safeAnimeName}_${safeSetName}_${safeImageName}`;
    const destinationPath = path.join(PUBLIC_IMAGES_DIR, publicFileName);
    
    // Copy the file from dataset to web-accessible location
    fs.copyFileSync(sourcePath, destinationPath);
    
    // Return the URL that Express will serve this image from
    return `${BASE_IMAGE_URL}/${publicFileName}`;
    
  } catch (error) {
    console.error(`❌ Failed to copy image ${sourcePath}:`, error.message);
    return null;
  }
}

/**
 * Process a single character set directory
 * This handles your specific naming convention: 1.jpg through 7.jpg, plus original.jpg
 */
function processCharacterSet(animeName, characterSetPath, characterSetName) {
  console.log(`    🎭 Processing character set: ${characterSetName}`);
  
  const imageUrls = [];
  
  // Your specific image sequence for progressive reveal
  const expectedImages = ['1', '2', '3', '4', '5', '6', '7', 'original'];
  
  for (const imageName of expectedImages) {
    let imageFound = false;
    
    // Try different file extensions since datasets might have mixed formats
    for (const extension of ['.jpg', '.jpeg', '.png', '.gif']) {
      const imageFileName = imageName + extension;
      const imagePath = path.join(characterSetPath, imageFileName);
      
      if (fs.existsSync(imagePath)) {
        const imageUrl = copyImageFile(imagePath, animeName, characterSetName, imageFileName);
        
        if (imageUrl) {
          imageUrls.push(imageUrl);
          imageFound = true;
          break; // Found the image, no need to try other extensions
        }
      }
    }
    
    if (!imageFound) {
      console.warn(`      ⚠️ Missing image: ${imageName} in ${characterSetName}`);
    }
  }
  
  console.log(`      📸 Found ${imageUrls.length}/8 expected images`);
  return imageUrls;
}

/**
 * Process a single anime directory
 * This reads one anime folder and all its character subfolders
 */
function processAnimeFolder(animeFolder, alternatives) {
  console.log(`\n🎬 Processing anime: ${animeFolder}`);
  
  const animePath = path.join(DATASET_PATH, animeFolder);
  
  // Verify this is a valid directory
  if (!fs.existsSync(animePath) || !fs.statSync(animePath).isDirectory()) {
    console.log(`  ⚠️ Skipping ${animeFolder} - not a valid directory`);
    return null;
  }
  
  // Find character set subfolders (like "Chainsaw Man_1", "Chainsaw Man_2", etc.)
  let characterSetFolders;
  try {
    characterSetFolders = fs.readdirSync(animePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    console.log(`  ❌ Could not read anime directory ${animeFolder}:`, error.message);
    return null;
  }
  
  console.log(`  📂 Found ${characterSetFolders.length} character sets`);
  
  if (characterSetFolders.length === 0) {
    console.log(`  ⚠️ No character set folders found in ${animeFolder}`);
    return null;
  }
  
  // Process each character set to create image sets for the database
  const imageSets = [];
  
  for (const characterSetFolder of characterSetFolders) {
    try {
      const characterSetPath = path.join(animePath, characterSetFolder);
      const imageUrls = processCharacterSet(animeFolder, characterSetPath, characterSetFolder);
      
      // Only include character sets with at least 3 images (required by schema)
      if (imageUrls.length >= 3) {
        imageSets.push({
          setName: characterSetFolder,
          images: imageUrls
          // setId will be auto-generated by mongoose
        });
        console.log(`    ✅ Added character set: ${characterSetFolder} (${imageUrls.length} images)`);
      } else {
        console.log(`    ⚠️ Skipped ${characterSetFolder}: only ${imageUrls.length} images (need at least 3)`);
      }
    } catch (error) {
      console.log(`    ❌ Error processing character set ${characterSetFolder}:`, error.message);
    }
  }
  
  if (imageSets.length === 0) {
    console.log(`  ❌ No valid character sets found for ${animeFolder}`);
    return null;
  }
  
  // Create question data that matches your mongoose schema exactly
  const questionData = {
    animeTitle: animeFolder,                           // Folder name becomes the answer
    alternativeTitles: alternatives[animeFolder] || [], // Alternative names from your file
    imageSets: imageSets                               // All the character sets for this anime
  };
  
  console.log(`  ✅ Created question with ${imageSets.length} character sets`);
  return questionData;
}

/**
 * Process the entire dataset
 * This goes through all anime folders in your mounted dataset directory
 */
function processAllAnime(alternatives) {
  console.log(`\n📂 Scanning dataset directory: ${DATASET_PATH}`);
  
  // Check if dataset directory exists (should be mounted as volume)
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Dataset directory not found: ${DATASET_PATH}\n💡 Make sure your dataset is mounted as a volume in docker-compose.yml`);
  }
  
  // Get all anime folders
  let animeFolders;
  try {
    animeFolders = fs.readdirSync(DATASET_PATH, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    throw new Error(`Could not read dataset directory: ${error.message}`);
  }
  
  console.log(`📊 Found ${animeFolders.length} anime folders to process`);
  
  if (animeFolders.length === 0) {
    console.log('⚠️ No anime folders found in dataset directory');
    console.log('💡 Check that your dataset directory contains anime folders');
    return [];
  }
  
  const allQuestions = [];
  let successCount = 0;
  let skipCount = 0;
  
  // Process each anime folder with progress reporting
  for (let i = 0; i < animeFolders.length; i++) {
    const animeFolder = animeFolders[i];
    console.log(`\n[${i + 1}/${animeFolders.length}] Processing: ${animeFolder}`);
    
    try {
      const questionData = processAnimeFolder(animeFolder, alternatives);
      
      if (questionData) {
        allQuestions.push(questionData);
        successCount++;
      } else {
        skipCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${animeFolder}:`, error.message);
      skipCount++;
    }
  }
  
  console.log(`\n📈 Processing Summary:`);
  console.log(`  🎯 Successfully processed: ${successCount} anime`);
  console.log(`  ⚠️ Skipped: ${skipCount} anime`);
  console.log(`  📝 Total questions created: ${allQuestions.length}`);
  
  return allQuestions;
}

/**
 * Save all questions to MongoDB
 * This creates Question documents that follow your exact schema
 */
async function saveQuestionsToDatabase(questionsData) {
  console.log('\n💾 Saving questions to MongoDB...');
  
  if (questionsData.length === 0) {
    console.log('⚠️ No questions to save');
    return { successCount: 0, skipCount: 0, errorCount: 0 };
  }
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < questionsData.length; i++) {
    const questionData = questionsData[i];
    
    try {
      // Check if this anime already exists in the database
      const existingQuestion = await Question.findOne({ animeTitle: questionData.animeTitle });
      
      if (existingQuestion) {
        console.log(`  [${i + 1}/${questionsData.length}] ⚠️ "${questionData.animeTitle}" already exists, skipping`);
        skipCount++;
        continue;
      }
      
      // Create new Question document using your mongoose model
      const question = new Question(questionData);
      await question.save();
      
      console.log(`  [${i + 1}/${questionsData.length}] ✅ Saved: "${questionData.animeTitle}" (${questionData.imageSets.length} character sets)`);
      successCount++;
      
    } catch (error) {
      console.error(`  [${i + 1}/${questionsData.length}] ❌ Failed to save "${questionData.animeTitle}":`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n💾 Database Save Summary:`);
  console.log(`  ✅ Successfully saved: ${successCount} questions`);
  console.log(`  ⚠️ Skipped (already exist): ${skipCount} questions`);
  console.log(`  ❌ Failed to save: ${errorCount} questions`);
  
  return { successCount, skipCount, errorCount };
}

/**
 * Main import function
 * This coordinates the entire import process
 */
async function importDataset() {
  console.log('🚀 Starting Docker dataset import...\n');
  
  try {
    // Validate environment
    if (!MONGO_URL) {
      throw new Error('MONGO_URL environment variable not set');
    }
    
    console.log('🔌 Connecting to MongoDB...');
    // Hide credentials in logs for security
    const logUrl = MONGO_URL.replace(/\/\/.*@/, '//***:***@');
    console.log('   URL:', logUrl);
    
    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB');
    
    // Prepare directories
    ensureImagesDirectory();
    
    // Load alternative names
    const alternatives = loadAlternativeNames();
    
    // Process the entire dataset
    const questionsData = processAllAnime(alternatives);
    
    if (questionsData.length === 0) {
      console.log('\n⚠️ No questions were created. Possible issues:');
      console.log('  📁 Check that dataset directory is properly mounted at /app/dataset_resized');
      console.log('  🎭 Check that anime folders contain character subfolders');
      console.log('  🖼️ Check that character folders contain image files (1.jpg through 7.jpg, original.jpg)');
      return { success: false, reason: 'No data processed' };
    }
    
    // Save everything to MongoDB
    const result = await saveQuestionsToDatabase(questionsData);
    
    // Final success summary
    console.log('\n🎉 Docker import completed successfully!');
    console.log(`📊 Questions in database: ${result.successCount}`);
    console.log(`🖼️ Images available at: ${PUBLIC_IMAGES_DIR}`);
    console.log('🎮 System ready for game creation!');
    
    return { 
      success: true, 
      questionsImported: result.successCount,
      questionsSkipped: result.skipCount,
      errors: result.errorCount
    };
    
  } catch (error) {
    console.error('\n❌ Docker import failed:', error.message);
    
    // Provide helpful debugging hints
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 MongoDB connection failed. Check that MongoDB service is running.');
    } else if (error.message.includes('Dataset directory not found')) {
      console.log('💡 Dataset not found. Check your Docker volume mounts in docker-compose.yml');
    }
    
    return { success: false, reason: error.message };
    
  } finally {
    // Always clean up the database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Export for testing or use in other scripts
module.exports = {
  importDataset,
  processAllAnime,
  loadAlternativeNames,
  saveQuestionsToDatabase
};

// Auto-run if this script is called directly
if (require.main === module) {
  importDataset()
    .then(result => {
      // Exit with appropriate code: 0 for success, 1 for failure
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
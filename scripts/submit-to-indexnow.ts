/**
 * Script to submit URLs to IndexNow (Bing)
 * 
 * Usage:
 *   npx tsx scripts/submit-to-indexnow.ts [type]
 * 
 * Types:
 *   main - Submit main pages only
 *   blog - Submit blog posts only
 *   all  - Submit everything (default)
 * 
 * Examples:
 *   npx tsx scripts/submit-to-indexnow.ts
 *   npx tsx scripts/submit-to-indexnow.ts main
 *   npx tsx scripts/submit-to-indexnow.ts blog
 */

import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });
config({ path: ".env.development" });
config({ path: ".env.production" });

const SITE_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://nanobananafree.app";
const type = process.argv[2] || "all";

async function submitToIndexNow() {
  try {
    console.log(`\n🚀 Submitting URLs to IndexNow (Bing)...\n`);
    console.log(`   Site: ${SITE_URL}`);
    console.log(`   Type: ${type}\n`);

    // First, preview what will be submitted
    console.log("📋 Fetching URLs to submit...\n");
    
    const previewUrl = `${SITE_URL}/api/indexnow/submit?type=${type}`;
    const previewResponse = await fetch(previewUrl);
    
    if (!previewResponse.ok) {
      throw new Error(`Preview failed: ${previewResponse.statusText}`);
    }

    const preview = await previewResponse.json();
    
    console.log(`   Found ${preview.count} URLs:\n`);
    preview.urls.forEach((url: string, index: number) => {
      console.log(`   ${index + 1}. ${url}`);
    });

    console.log(`\n📤 Submitting to IndexNow...\n`);

    // Submit to IndexNow
    const submitUrl = `${SITE_URL}/api/indexnow/submit?type=${type}`;
    const submitResponse = await fetch(submitUrl, {
      method: "POST",
    });

    const result = await submitResponse.json();

    if (result.success) {
      console.log(`✅ Success!\n`);
      console.log(`   ${result.message}`);
      console.log(`   Submitted: ${result.submitted} URLs`);
      console.log(`   Type: ${result.type}\n`);
      
      console.log("🔍 Next steps:");
      console.log("   1. Wait 5-10 minutes for Bing to process");
      console.log("   2. Check Bing Webmaster Tools for indexing status");
      console.log("   3. Monitor search console for any errors\n");
    } else {
      console.error(`❌ Submission failed!\n`);
      console.error(`   Error: ${result.error}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Script error:\n`);
    console.error(error);
    console.error("");
    process.exit(1);
  }
}

// Run the script
submitToIndexNow();


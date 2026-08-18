const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Xanezu Catch - Professional Build System
 * Automates version syncing and Inno Setup compilation.
 */

const PACKAGE_PATH = path.join(__dirname, '..', 'package.json');
const ISS_PATH = path.join(__dirname, '..', 'build', 'installer_script.iss');
const ISCC_PATH = 'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe';

function build() {
    console.log('🚀 Starting Professional Installer Build...');

    // 1. Sync Version
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
    const version = pkg.version;
    console.log(`📦 Version detected in package.json: ${version}`);

    let issContent = fs.readFileSync(ISS_PATH, 'utf8');
    const versionRegex = /#define MyAppVersion ".*"/;
    const newVersionLine = `#define MyAppVersion "${version}"`;
    
    if (issContent.match(versionRegex)) {
        issContent = issContent.replace(versionRegex, newVersionLine);
        fs.writeFileSync(ISS_PATH, issContent);
        console.log(`✅ Normalized installer_script.iss to version ${version}`);
    }

    // 2. Compile Installer
    try {
        console.log(`🔨 Compiling with Inno Setup (ISCC)...`);
        // Using absolute path since ISCC is not in global PATH
        const cmd = `"${ISCC_PATH}" "${ISS_PATH}"`;
        execSync(cmd, { stdio: 'inherit' });
        console.log(`✨ Installer generated successfully in dist/installer/`);
    } catch (error) {
        console.error(`❌ Build failed: ${error.message}`);
        process.exit(1);
    }
}

build();

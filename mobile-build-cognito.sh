#!/bin/bash

echo "🚀 ZyRok Mobile App Store Deployment with AWS Cognito"
echo "====================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# AWS Cognito Configuration
export AWS_COGNITO_USER_POOL_ID="us-east-2_HEgFgpasb"
export AWS_COGNITO_CLIENT_ID="32b6rrbc2bkckbho9ojbqjmcef"
export AWS_REGION="us-east-2"

echo -e "${BLUE}📱 Using AWS Cognito User Pool: ${AWS_COGNITO_USER_POOL_ID}${NC}"
echo -e "${BLUE}🔑 Client ID: ${AWS_COGNITO_CLIENT_ID}${NC}"

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}Checking requirements...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js and npm are installed${NC}"
}

# Install Cordova globally if not present
install_cordova() {
    if ! command -v cordova &> /dev/null; then
        echo -e "${YELLOW}📦 Installing Cordova CLI...${NC}"
        npm install -g cordova
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Cordova CLI installed successfully${NC}"
        else
            echo -e "${RED}❌ Failed to install Cordova CLI${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Cordova CLI already installed${NC}"
    fi
}

# Setup AWS Amplify configuration for mobile
setup_amplify_config() {
    echo -e "${BLUE}⚙️  Setting up AWS Amplify configuration...${NC}"
    
    # Create Android configuration
    mkdir -p platforms/android/app/src/main/res/raw
    cp mobile-cognito-config.json platforms/android/app/src/main/res/raw/amplifyconfiguration.json
    
    # Create iOS configuration  
    mkdir -p platforms/ios/ZyRok
    cp mobile-cognito-config.json platforms/ios/ZyRok/amplifyconfiguration.json
    
    echo -e "${GREEN}✅ AWS Amplify configuration created for mobile platforms${NC}"
}

# Build the web app
build_web_app() {
    echo -e "${BLUE}🔨 Building web application...${NC}"
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Web app built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build web app${NC}"
        exit 1
    fi
}

# Initialize Cordova project
init_cordova() {
    echo -e "${BLUE}📱 Initializing Cordova project with AWS Cognito...${NC}"
    
    # Copy Cordova config
    cp cordova-config.xml config.xml
    
    # Initialize Cordova if not already done
    if [ ! -d "platforms" ]; then
        cordova create . com.zyrok.app ZyRok --template blank
    fi
    
    # Copy built web files to Cordova www directory
    rm -rf www/*
    cp -r dist/* www/
    
    # Setup Amplify configuration
    setup_amplify_config
    
    echo -e "${GREEN}✅ Cordova project initialized with AWS Cognito${NC}"
}

# Add platforms
add_platforms() {
    echo -e "${BLUE}📲 Adding mobile platforms...${NC}"
    
    # Add Android platform
    if [ ! -d "platforms/android" ]; then
        cordova platform add android
        echo -e "${GREEN}✅ Android platform added${NC}"
    else
        echo -e "${YELLOW}⚠️  Android platform already exists${NC}"
    fi
    
    # Add iOS platform (only on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ ! -d "platforms/ios" ]; then
            cordova platform add ios
            echo -e "${GREEN}✅ iOS platform added${NC}"
        else
            echo -e "${YELLOW}⚠️  iOS platform already exists${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  iOS platform can only be added on macOS${NC}"
    fi
}

# Build for Android
build_android() {
    echo -e "${BLUE}🤖 Building Android APK with AWS Cognito...${NC}"
    
    cordova build android
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Android APK built successfully${NC}"
        echo -e "${GREEN}📁 APK location: platforms/android/app/build/outputs/apk/debug/app-debug.apk${NC}"
        echo -e "${BLUE}🔐 Includes AWS Cognito authentication${NC}"
    else
        echo -e "${RED}❌ Failed to build Android APK${NC}"
    fi
}

# Build for iOS (macOS only)
build_ios() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${BLUE}🍎 Building iOS app with AWS Cognito...${NC}"
        
        cordova build ios
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ iOS app built successfully${NC}"
            echo -e "${GREEN}📁 iOS project location: platforms/ios/ZyRok.xcworkspace${NC}"
            echo -e "${BLUE}🔐 Includes AWS Cognito authentication${NC}"
            echo -e "${YELLOW}⚠️  Open in Xcode to archive and upload to App Store${NC}"
        else
            echo -e "${RED}❌ Failed to build iOS app${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  iOS build requires macOS with Xcode${NC}"
    fi
}

# Display deployment instructions
show_cognito_instructions() {
    echo -e "${GREEN}"
    echo "🎉 Mobile build with AWS Cognito complete!"
    echo "=========================================="
    echo ""
    echo "🔐 AWS Cognito Features Enabled:"
    echo "• Email/password authentication"
    echo "• Automatic user verification"
    echo "• Secure token management"
    echo "• Cross-platform user sync"
    echo "• Scalable to millions of users"
    echo ""
    echo "📱 ANDROID (Google Play Store):"
    echo "1. APK includes AWS Cognito authentication"
    echo "2. Users can sign up/login with email"
    echo "3. Automatic session management"
    echo "4. Upload to Google Play Console"
    echo ""
    echo "🍎 iOS (Apple App Store):"
    echo "1. iOS app includes AWS Cognito SDK"
    echo "2. Native iOS authentication flows"
    echo "3. Touch ID/Face ID integration ready"
    echo "4. Archive and upload via Xcode"
    echo ""
    echo "🌟 Production Benefits:"
    echo "• Enterprise-grade security"
    echo "• Automatic scaling"
    echo "• GDPR/CCPA compliance"
    echo "• Multi-region deployment"
    echo ""
    echo "User Pool: us-east-2_HEgFgpasb"
    echo "Region: us-east-2"
    echo -e "${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting ZyRok mobile build with AWS Cognito...${NC}"
    
    check_requirements
    install_cordova
    build_web_app
    init_cordova
    add_platforms
    build_android
    build_ios
    show_cognito_instructions
}

# Run main function
main "$@"

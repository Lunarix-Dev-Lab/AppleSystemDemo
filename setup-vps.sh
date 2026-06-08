#!/bin/bash
# Optional: VPS setup script to install Docker & Docker Compose
# Run this only if Docker is not already installed on your VPS

set -e

echo "🔧 Installing Docker and Docker Compose..."
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
fi

case "$OS" in
    ubuntu|debian)
        echo "📦 Detected Debian/Ubuntu - installing..."
        
        # Update package manager
        sudo apt-get update
        
        # Install Docker
        sudo apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Add Docker GPG key
        curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        echo \
            "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS \
            $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
        # Install Docker Compose (standalone)
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # Start Docker service
        sudo systemctl start docker
        sudo systemctl enable docker
        
        # Optional: Add current user to docker group (requires logout/login)
        # sudo usermod -aG docker $(whoami)
        
        echo "✅ Docker installed successfully"
        ;;
    
    centos|rhel|fedora)
        echo "📦 Detected RHEL/CentOS - installing..."
        
        # Install Docker
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io
        
        # Install Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # Start Docker service
        sudo systemctl start docker
        sudo systemctl enable docker
        
        echo "✅ Docker installed successfully"
        ;;
    
    alpine)
        echo "📦 Detected Alpine - installing..."
        
        sudo apk add --no-cache docker docker-compose
        sudo rc-service docker start
        sudo rc-update add docker
        
        echo "✅ Docker installed successfully"
        ;;
    
    *)
        echo "❌ Unsupported OS: $OS"
        echo "Please install Docker manually: https://docs.docker.com/engine/install/"
        exit 1
        ;;
esac

echo ""
echo "✨ Setup complete!"
echo ""
echo "📊 Verification:"
docker --version
docker-compose --version
echo ""
echo "Next: Run ./deploy.sh to start your application"

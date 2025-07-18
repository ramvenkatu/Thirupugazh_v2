# Thirupugazh Song List Generator

A sophisticated web application for automatically generating Thirupugazh bhajan playlists following the traditional 13-step sequence. This application streamlines playlist creation for bhajan organizers by implementing intelligent song selection algorithms and providing AI-powered playlist modifications.

## Features

### Core Functionality
- **Automated Playlist Generation**: Follows the strict 13-step sequence as per traditional requirements
- **Duration-Based Selection**: Generate playlists for any duration between 10-300 minutes
- **Repetition Avoidance**: MySQL database tracks recently used songs to ensure variety
- **AI-Powered Modifications**: Natural language chatbot for playlist adjustments
- **PDF Export**: Professional PDF output with complete song details

### Technical Features
- **Responsive Design**: 45%/55% column layout on desktop, stacked on mobile
- **Real-time Status**: Connection monitoring and live updates
- **Modern UI**: Bootstrap 5 with custom professional styling
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Security**: Environment-based configuration for sensitive data

## Technology Stack

### Frontend
- **HTML5** with semantic structure
- **CSS3** with custom variables and responsive design
- **JavaScript ES6+** with modular architecture
- **Bootstrap 5** for UI components
- **jsPDF** for PDF generation

### Backend
- **Node.js** with Express framework
- **MySQL** for playlist history and data persistence
- **RESTful API** design
- **LLM Integration** for AI chatbot functionality

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Quick Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd Thirupugazh_v1
npm install
```

2. **Database Setup**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE thirupugazh_db;
exit
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=thirupugazh_db

# LLM API (Optional - for AI chatbot)
LLM_API_KEY=your_api_key_here
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-3.5-turbo

# Application Settings
CORS_ORIGIN=http://localhost:3000
MAX_PLAYLIST_DURATION=180
DEFAULT_DURATION=60
```

4. **Start the Application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

5. **Access the Application**
Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### Generating a Playlist

1. **Set Duration**: Enter desired playlist duration (10-300 minutes)
2. **Generate**: Click "Generate Playlist" button
3. **Review**: The system will create a playlist following the 13-step sequence:
   - கைத்தலம் (Compulsory opening)
   - விநாயகர் துதி (Additional song)
   - விநாயகர் நாமாவளி
   - குரு வணக்கம்
   - Five Abodes (திருப்பரங்குன்றம், திருசெந்தூர், திருப்பழனி, ஸ்வாமி மலை, திருத்தணிகை)
   - பழமுதிர் சோலை
   - கந்தர் அனுபூதி
   - வே, ம, சே
   - விரு
   - மகுடம்
   - வகுப்பு
   - பொதுப் பாடல்கள் (to fill remaining time)

### AI Assistant Features

- **Natural Language Commands**: "Remove the first song", "Add more songs from Thiruchendur"
- **Playlist Modifications**: The AI can help adjust your playlist based on your requirements
- **Smart Suggestions**: Get recommendations for improving your playlist

### Export and Management

- **PDF Export**: Generate professional PDFs with complete song details
- **Shuffle Playlist**: Randomize song order (keeping sequence integrity)
- **Clear Playlist**: Start fresh with a new generation

## API Endpoints

### Playlist Generation
```
POST /api/generate-playlist
Content-Type: application/json

{
  "duration": 60
}
```

### AI Chat
```
POST /api/llm-chat
Content-Type: application/json

{
  "message": "Remove the first song",
  "playlist": [...]
}
```

### Health Check
```
GET /api/health
```

## File Structure

```
Thirupugazh_v1/
├── server.js                 # Node.js backend server
├── package.json              # Dependencies and scripts
├── songs.js                  # Complete song database
├── index.html                # Main frontend interface
├── style.css                 # Custom styling
├── script.js                 # Client-side logic
├── README.md                 # Documentation
├── .env.example              # Environment template
└── .gitignore               # Git ignore rules
```

## Database Schema

### playlist_history
```sql
CREATE TABLE playlist_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    song_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment

### Production Deployment

1. **Environment Setup**
```bash
NODE_ENV=production
PORT=80
```

2. **Database Configuration**
- Use production MySQL credentials
- Ensure proper database permissions
- Set up regular backups

3. **Security Considerations**
- Use HTTPS in production
- Secure your LLM API keys
- Implement rate limiting if needed
- Regular security updates

### Docker Deployment (Optional)

```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `DB_HOST` | MySQL host | localhost | Yes |
| `DB_USERNAME` | MySQL username | - | Yes |
| `DB_PASSWORD` | MySQL password | - | Yes |
| `DB_NAME` | Database name | thirupugazh_db | Yes |
| `LLM_API_KEY` | AI service API key | - | No* |
| `LLM_API_URL` | AI service endpoint | OpenAI | No* |

*Required for AI chatbot functionality

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL credentials in `.env`
   - Ensure MySQL service is running
   - Verify database exists

2. **Songs Not Loading**
   - Check if `songs.js` file exists
   - Verify file permissions
   - Check browser console for errors

3. **PDF Export Not Working**
   - Ensure jsPDF libraries are loaded
   - Check browser compatibility
   - Clear browser cache

4. **AI Chatbot Not Responding**
   - Verify `LLM_API_KEY` is set
   - Check API endpoint configuration
   - Review network connectivity

### Log Files

Application logs are displayed in the console during development. For production, consider implementing proper logging with tools like Winston.

## Development

### Development Mode
```bash
npm run dev
```

### Code Structure

- **Separation of Concerns**: HTML structure, CSS presentation, JavaScript behavior
- **Modular Architecture**: Class-based organization in JavaScript
- **RESTful API**: Clean endpoint design
- **Responsive Design**: Mobile-first approach

### Contributing

1. Follow the existing code style
2. Ensure responsive design compatibility
3. Test across different browsers
4. Update documentation for new features

## Keyboard Shortcuts

- `Ctrl + Enter`: Generate playlist
- `Ctrl + P`: Export PDF
- `Ctrl + Shift + C`: Clear playlist
- `Enter`: Send chat message

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For technical support or feature requests, please create an issue in the project repository.

## Version History

- **v2.0.0**: Complete application with AI integration
- **v1.0.0**: Basic playlist generation functionality

---

**Note**: This application is designed specifically for Thirupugazh bhajan playlist generation following traditional sequences. The song database contains authentic compositions and should be used respectfully for devotional purposes. 
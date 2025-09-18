# 📚 DocuMind AI - Document QA System

A modern, AI-powered document question-answering system that allows users to upload PDF documents and ask intelligent questions about their content.

## ✨ Features

- **Smart Document Processing**: Upload PDF documents and extract text for AI analysis
- **Intelligent Q&A**: Ask questions about your documents and get contextual answers
- **Conversation History**: Maintain chat sessions with conversation context
- **User Authentication**: Google OAuth integration for secure access
- **Modern UI**: Clean, responsive interface built with Next.js and Material-UI
- **Cloud Storage**: S3 integration for document storage
- **Vector Search**: FAISS-powered semantic search for accurate responses

## 🚀 Recent Improvements

### Backend Enhancements
- ✅ **CORS Configuration**: Added production frontend URL (`https://document-qa-system-1.onrender.com`)
- ✅ **Enhanced Error Handling**: Comprehensive try-catch blocks with detailed error messages
- ✅ **Code Style**: Improved imports, type hints, and documentation
- ✅ **Input Validation**: Better file type validation and user authentication checks
- ✅ **Resource Cleanup**: Proper cleanup of temporary files after processing

### Frontend Improvements
- ✅ **Brand Identity**: Replaced logo with stylish "📚 DocuMind AI" text with gradient styling
- ✅ **UI/UX Fixes**: Fixed ChatInput positioning issue for better user experience
- ✅ **Code Organization**: Improved component structure and added useCallback hooks
- ✅ **Better Error Handling**: Enhanced error messages and user feedback
- ✅ **Accessibility**: Added tooltips and better ARIA labels

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM with PostgreSQL
- **LangChain**: AI/ML framework for document processing
- **FAISS**: Vector similarity search
- **Google Gemini**: AI model for question answering
- **AWS S3**: Cloud storage for documents

### Frontend
- **Next.js**: React framework with SSR
- **Material-UI**: Modern React component library
- **TypeScript**: Type-safe JavaScript
- **Axios**: HTTP client for API calls
- **React Context**: State management

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL database
- AWS S3 bucket
- Google OAuth credentials
- Google Gemini API key

## 🔧 Installation & Setup

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd document-qa-system/backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   cp .env.sample .env
   ```
   
   Update `.env` with your credentials:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/docqa_db
   UPLOAD_DIR=./uploaded_pdfs
   GEMINI_API_KEY=your_gemini_api_key
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_S3_BUCKET_NAME=your_s3_bucket_name
   ```

4. **Database Setup**
   ```bash
   alembic upgrade head
   ```

5. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.sample .env.local
   ```
   
   Update `.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. **Run the frontend**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Backend (Render/Railway/Heroku)
- Set environment variables in your deployment platform
- Ensure PostgreSQL database is configured
- Deploy from the `/backend` directory

### Frontend (Render/Vercel/Netlify)
- Set `NEXT_PUBLIC_BACKEND_BASE_URL` to your backend URL
- Deploy from the `/frontend` directory
- The build command is: `npm run build`
- The start command is: `npm start`

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

- `POST /upload/` - Upload a PDF document
- `POST /ask/` - Ask a question about a document
- `GET /ask/conversations/{session_id}` - Get conversation history
- `GET /docs/` - List user documents
- `DELETE /docs/{doc_id}` - Delete a document

## 🔒 Security Features

- **CORS Protection**: Configured for specific origins
- **Input Validation**: File type and content validation
- **Error Handling**: Secure error messages without sensitive data exposure
- **Authentication**: Google OAuth integration
- **Resource Cleanup**: Automatic cleanup of temporary files

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured with your frontend URL
2. **File Upload Issues**: Check file permissions and upload directory
3. **Database Connection**: Verify PostgreSQL connection string
4. **API Key Issues**: Ensure all API keys are correctly set in environment variables

### Development Tips

- Use `npm run dev` for frontend development with hot reload
- Use `uvicorn app.main:app --reload` for backend development
- Check browser console and backend logs for detailed error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and create a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- LangChain for document processing framework
- Material-UI for beautiful React components
- FastAPI for the excellent Python web framework

# Kaira Assistant

Kaira Assistant is a modern, AI-powered assistant platform with a Next.js frontend and Python backend. It is designed for extensibility, real-time communication, and easy deployment using Docker. The agent leverages `livekit` for real-time chat and transcription capabilities.

## Demo

## Demo

> 🎥 **Watch Kaira Assistant in action:**

https://github.com/user-attachments/assets/your-video-id-here

_Note: Upload your demo video (`demo/kaira.mp4`) to GitHub by dragging it into an issue or pull request comment, then replace the URL above with the generated link._

Alternatively, if hosting the video locally:

```markdown
<video width="100%" controls>
    <source src="demo/kaira.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>
```


## Features
- Conversational AI agent
- Real-time chat and transcription (LiveKit integration)
- Modular frontend (Next.js, React)
- Extensible backend (Python)
- Dockerized for development and production
- Customizable UI components

## Project Structure

- `frontend/` — Next.js app (React, TypeScript)
- `server/` — Python backend (agent logic, API)
- `docker-compose-dev.yml` / `docker-compose-prod.yml` — Docker orchestration

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (for frontend)
- [Python 3.12+](https://www.python.org/) (for backend)
- [Docker](https://www.docker.com/) (recommended)

### Development Setup

#### 1. Clone the repository
```sh
git clone https://github.com/abishlal/kaira.git
cd kaira
```

#### 2. Start with Docker (recommended)
```sh
docker-compose -f docker-compose-dev.yml up --build
```

#### 3. Manual Setup

**Frontend:**
```sh
cd frontend
pnpm install # or npm install
pnpm dev     # or npm run dev
```

**Backend:**
```sh
cd server
uv sync
uv run src/agents dev
```

## Usage

Access the frontend at [http://localhost:3000](http://localhost:3000) and interact with the assistant.

## Configuration

- Frontend config: `frontend/app-config.ts`
- Backend config: see `server/src/agent.py` and related files

## Testing

**Backend tests:**
```sh
cd server
pytest
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a pull request

## License

See `LICENSE` files in `frontend/` and `server/` for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [LiveKit](https://livekit.io/)
- [Python](https://www.python.org/)

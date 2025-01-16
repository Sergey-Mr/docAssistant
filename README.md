# AI Text Revision System

A web application for revising and improving text using AI assistance, with multi-tab support and version history tracking.

## Features

- Text highlighting and annotation system
- AI-powered revision suggestions
- Multi-tab document management
- Revision history tracking
- Dark/light theme support
- Real-time content updates

## Prerequisites

- **PHP** 8.2 or higher
- **Node.js** & npm
- **Composer**
- **SQLite** (or your preferred database)
- **OpenAI API Key**

## Docekr Deployment Instruction

### 1. Build and run Docker containers
```bash
docker-compose up --build -d
```
### 2. Create the database
```bash
sudo docker-compose exec db bash
mysql -u root -p
CREATE DATABASE docassistant;
```

### 3. Run migrations
```bash
sudo docker-compose exec app bash
php artisan migrate
```

### 4. Install dependencies
```bash 
php artisan key:generate
docker-compose exec --user root app bash
rm -rf /var/www/docAssistant/node_modules
npm cache clean --force
chown -R www-data:www-data /var/www/.npm
npm install
npm run build
```

### 5. Access the application
Open your web browser and navigate to http://localhost:8090 or the port specified in your docker-compose.yml

## Manual Instructions

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/Sergey-Mr/docAssistant.git
cd docAssistant
composer install
npm install
```

### 2. Configure the Environment
1. Copy the example environment file and generate the application key:
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```
2. Add the following to the `.env` file:
    - **Database configuration**: Set up your database connection. For example:
        ```env
        DB_DATABASE={your_db_name}
        DB_USERNAME={username}
        DB_PASSWORD={password}
        
        DB_CONNECTION=sqlite
        DB_DATABASE=/absolute/path/to/your/database.sqlite
        ```
      (Alternatively, configure MySQL or another database of your choice.)
    - **OpenAI API Key**: Add your OpenAI API key:
        ```env
        OPENAI_API_KEY=your-api-key-here
        ```

### 3. Set Up the Database
1. Run the database migrations:
    ```bash
    php artisan migrate
    ```

### 4. Start Development Servers
1. Launch the backend:
    ```bash
    php artisan serve
    ```
2. Run the frontend:
    ```bash
    npm run dev
    ```

Your project should now be available at `http://localhost:8000` (by default).

---

## Architecture Decisions

### Prompt Engineering
The application uses GPT-4 with a specific prompt designed to handle text revisions. The prompt was derived emprically. 
The model receives the following data:
- Context: the whole text of the user.
- Annotations: the portions of text selected by the user and user`s instructions.

**Temperature = 0.7** was derived emperically and proved to be the most suitable level for the purpouse of the web application.
  
The model is instructed to act as a text revision assistant and performs the following tasks:
- Revise specific annotated text portions while keeping the rest intact.
- Ensure revisions blend seamlessly with the original text.
- Return a JSON response containing:
  1. The full revised text.
  2. Original and revised sections.
  3. Explanations for each change.

**Please find more details on prompt implementations: [ChatGPT Service Implementation](/app/Services/ChatGPTService.php)**

### Backend
- **Framework**: Laravel.
- **Database Structure**:
  - `tabs`: Manages multiple document contexts.
  - `text_changes`: Records version history with explanations.
  - `user_texts`: Stores current text content.

### Frontend
- **Framework**: Alpine.js, a lightweight JavaScript library for reactive components.
    - Handles real-time UI updates.
    - Manages tab switching and content state.
    - Minimal overhead compared to larger frameworks.
- **Styling**: Tailwind CSS, a utility-first framework.
    - Enables rapid UI development.
    - Built-in dark mode support.
    - Ensures consistent component styling.

### Key Components
- **JavaScript Classes**:
  - `TextEditor`: Core editing functionality with annotation support.
  - `TabManager`: Handles tab CRUD operations.
  - `DashboardNotifications`: User feedback system.
- **Laravel Controllers**:
  - `TabController`: Manages document organization.
  - `TextController`: Handles text processing and history.
- **External Libraries**:
  - Laravel Breeze: Authentication scaffolding.
  - OpenAI API: AI-powered text suggestions.
  - Axios: HTTP client for API requests.
  - AlpineJS: Minimal reactive framework.
  - TailwindCSS: Utility-first styling.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

### Notes
To make the application work:
- Ensure that the OpenAI API key is added to your `.env` file under the `OPENAI_API_KEY` variable.
- Make sure your database connection is correctly set in the `.env` file.

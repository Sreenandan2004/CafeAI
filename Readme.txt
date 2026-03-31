================================================================================
          CafeIQ: AI-Powered Cafeteria Management & Forecasting System
================================================================================

1. PROJECT OVERVIEW
--------------------------------------------------------------------------------
CafeIQ is a modern web application designed for cafeteria and resource management. 
It differentiates itself by integrating a dedicated Python-based Machine Learning 
backend that handles complex data analysis, demand forecasting, and inventory 
optimization. 

By analyzing historical sales and spending, the system provides actionable 
intelligence that helps management reduce waste, optimize stock, and maximize 
revenue through data-driven decisions.


2. COMPONENT & FILE RESPONSIBILITY GUIDE
--------------------------------------------------------------------------------
The system is divided into a React Frontend (UI) and a Python Backend (Intelligence).

BACKEND (The "Intelligence" Layer - /backend):
*   app.py: The Flask API Entry Point. It serves as the "Dispatcher," routing 
    incoming data from the UI to the appropriate ML engine.
*   ml_models.py: The "Forecasting Brain." Implements Linear Regression and 
    Exponential Moving Averages (EMA). It calculates future revenue, spending, 
    and specific item demand.
*   insights_engine.py: The "Data Analyst." Processes historical data to find 
    top performers, declining trends, growth percentages, and generates 
    combo-meal recommendations.
*   requirements.txt: Lists all Python dependencies (Flask, Scikit-Learn, Pandas).

FRONTEND (The "User Interface" Layer - /src):
*   services/api.js: The "Communication Bridge." Standardizes how the React 
    app talks to the Python backend. Handles all fetch/POST requests.
*   pages/Dashboard.jsx: The "Executive Summary." Displays high-level KPIs like 
    today's revenue vs. predicted goals and critical inventory alerts.
*   pages/Forecasting.jsx: The "Future Predictor." Dedicated view for revenue 
    projections, trend lines, and item-by-item demand forecasting.
*   pages/Insights.jsx: The "AI Assistant." Visualizes heatmaps of sales 
    performance and lists prioritized business recommendations.
*   pages/Inventory.jsx: The "Stock Manager." Tracks current stock levels against 
    reorder points, highlighting items at risk of running out.
*   pages/Sales.jsx: The "History Log." Allows users to view and manage the 
    raw transaction data that feeds the ML models.
*   data/sampleData.js: Provides mock data to demonstrate the system's full 
    capabilities even without a live database.


3. REAL-WORLD DATA FLOW & EXECUTION
--------------------------------------------------------------------------------
Scenario: A manager wants to predict demand for "Veggie Burgers" for next month.

1. DATA CAPTURE (Frontend):
   The user opens the Sales page. The browser loads transaction history 
   stored in the React state or the local mock database (sampleData.js).

2. REQUEST INITIATION (Frontend -> Backend):
   The user navigates to the 'Forecasting' tab. The 'Forecasting.jsx' component 
   calls 'api.js', which packs the entire sales history into a JSON payload 
   and POSTs it to 'http://localhost:5000/api/forecast'.

3. INTELLIGENT PROCESSING (Backend):
   - 'app.py' receives the JSON and initializes 'ForecastingEngine' in 'ml_models.py'.
   - The engine converts the data into a Pandas DataFrame.
   - It filters every transaction for "Veggie Burgers."
   - A Linear Regression model is "trained" on the last 6 months of burger sales.
   - An EMA (Exponential Moving Average) is calculated to account for a recent 
     social media trend that spiked burger sales last week.
   - The model blends these two (70/30) to provide a final prediction.

4. RESPONSE & VISUALIZATION (Backend -> Frontend):
   The backend returns a JSON object containing { "predicted": 450, "trend": "up" }.
   'api.js' receives this, and React updates the UI.

5. FINAL OUTPUT (Frontend):
   The manager sees a "Success" card stating: "Demand for Veggie Burgers is expected 
   to rise to 450 units next month. Plan your ingredient orders accordingly."


4. CORE ARCHITECTURE & WORKFLOW
--------------------------------------------------------------------------------
The project follows a decoupled, two-tier architecture:

[ Frontend (React/Vite) ] <--- HTTP (REST) ---> [ Backend (Flask/Python) ]
           |                                             |
           V                                             V
    (Charts & UI)                                (ML & Data Engines)

THE WORKFLOW:
1. DATA INPUT: Sales and inventory records are managed in the React frontend.
2. API BRIDGE: When a forecast is needed, the frontend sends the raw dataset 
   (as JSON) to the Python backend via the 'api.js' service layer.
3. DATA transformation: The Flask backend receives the JSON and converts it 
   into efficient Pandas DataFrames for intensive calculation.
4. ML ANALYSIS:
    - The 'ForecastingEngine' fits linear models to detect trends.
    - The 'InsightsEngine' performs comparative analysis (Recent vs Previous).
5. VISUALIZATION: The results are returned as structured JSON, which Chart.js 
   uses to render interactive dashboards.


5. IMPLEMENTATION DEEP DIVE (THE "SECRET SAUCE")
--------------------------------------------------------------------------------
*   Scikit-Learn Integration: Unlike simple averages, CafeIQ uses the 
    'LinearRegression' algorithm to project future trends by calculating 
    the "slope" of revenue growth.
*   Blended Demand Model: Item demand forecasting uses a 70/30 blend:
    - 70% Linear Regression (captures long-term trend).
    - 30% Exponential Moving Average (EMA) (adjusts for recent spikes).
*   Time-Series Cross-Validation: Accuracy is calculated using a "leave-last-out" 
    approach. The engine tests its own predictions against known historical data 
    to provide the user with a confidence score (MAPE).
*   Comparative Trend Detection: The 'InsightsEngine' splits data into 30-day 
    windows to automatically detect items with high growth (+%) or critical 
    declines (%), triggering warning alerts.


6. PROJECT PRESENTATION POINTS (STRENGTHS)
--------------------------------------------------------------------------------
- Scalability: The separation of frontend (UI) and backend (Logic) allows 
  them to be deployed and scaled independently.
- Real AI Application: Demonstrates a practical use of Scikit-Learn beyond 
  simple tutorials—solving real-world business problems (Restocking/Pricing).
- User Experience: Complex mathematical data is abstracted into simple 
  "Traffic Light" cards (Success/Warning/Danger) and Natural Language insights.
- Performance: Leveraging Pandas on the backend ensures that analysis of 
  thousands of records happens in milliseconds.


7. TECHNOLOGY STACK
--------------------------------------------------------------------------------
FRONTEND:
- React (Component-based architecture)
- Vite (Ultra-fast build tool)
- Chart.js & React-Chartjs-2 (Data visualization)
- Vanilla CSS (Modern design patterns)

BACKEND:
- Flask (Python micro-framework)
- Scikit-Learn (Machine Learning & Predictions)
- Pandas (Data manipulation & Trend analysis)
- NumPy (Mathematical computations)


8. SETUP & EXECUTION
--------------------------------------------------------------------------------
PREREQUISITES: Node.js (v18+) and Python (v3.10+).

STEP 1: BACKEND SETUP
1. cd backend
2. python -m venv .venv
3. .\.venv\Scripts\activate   (Windows)
4. pip install -r requirements.txt
5. python app.py              (Runs on http://localhost:5000)

STEP 2: FRONTEND SETUP
1. (In root directory)
2. npm install
3. npm run dev                (Runs on http://localhost:5173)

================================================================================
Generated on: 2026-03-17
Project Version: 1.0.0
================================================================================

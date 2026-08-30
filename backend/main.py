from config import UPLOAD_DIR

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers.books import router as books_router
from routers.titles import router as titles_router
from routers.profile import router as profile_router

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads",
)


app.include_router(books_router)
app.include_router(titles_router)
app.include_router(profile_router)


@app.get("/")
def read_root():
    return {"message": "Murim Archive backend is running"}

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

router = APIRouter()

templates = Jinja2Templates(directory="templates")

@router.get("/", name="index")
def home(request:Request):
    return templates.TemplateResponse(
        request=request, 
        name="index.html",
        context={}

    )
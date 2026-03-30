from fastapi import APIRouter, Response
from datetime import datetime
from xml.etree import ElementTree as ET
from typing import List

router = APIRouter()

@router.get("/sitemap.xml")
async def get_sitemap():
    
    pages = [
        {"loc": "/", "priority": "1.0"},
        {"loc": "/history", "priority": "0.5"},
    ]
    
    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    
    for page in pages:
        url = ET.SubElement(urlset, "url")
        
        loc = ET.SubElement(url, "loc")
        loc.text = f"https://yourdomain.com{page['loc']}"
        
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = datetime.now().date().isoformat()
        
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = "weekly"
        
        priority = ET.SubElement(url, "priority")
        priority.text = page["priority"]
    

    xml_str = ET.tostring(urlset, encoding="unicode", method="xml")
    
    return Response(content=xml_str, media_type="application/xml")

@router.get("/robots.txt")
async def get_robots():
    robots_content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /profile/
Disallow: /api/

Sitemap: https://yourdomain.com/sitemap.xml
"""
    return Response(content=robots_content, media_type="text/plain")
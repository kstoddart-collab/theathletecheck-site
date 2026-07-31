document.head.insertAdjacentHTML('beforeend', `
  <style>
    #tac-injected-nav { flex-wrap: wrap; row-gap: 12px; }
    #tac-injected-nav .tac-nav-links { flex-wrap: wrap; }
    @media (max-width: 768px) {
      #tac-injected-nav { padding: 14px 20px !important; justify-content: center; }
      #tac-injected-nav .tac-nav-links {
        width: 100%;
        justify-content: center;
        gap: 18px !important;
      }
    }
  </style>
`);

document.body.insertAdjacentHTML('afterbegin', `
  <nav id="tac-injected-nav" style="
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 40px;
    background-color: #0a0f1e;
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    position: sticky;
    top: 0;
    z-index: 999;
  ">
    <a href="index.html" style="
      color: #ffffff;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.05em;
    ">★ THE ATHLETE CHECK</a>

    <div class="tac-nav-links" style="display: flex; gap: 32px;">
      <a href="index.html" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; transition: color 0.2s;"
         onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#ffffff'">HOME</a>
      <a href="assessment.html" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; transition: color 0.2s;"
         onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#ffffff'">ASSESSMENT</a>
      <a href="coaches.html" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; transition: color 0.2s;"
         onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#ffffff'">COACHES/ADS</a>
      <a href="courses.html" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; transition: color 0.2s;"
         onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#ffffff'">COURSES</a>
      <a href="proudmoment.html" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; transition: color 0.2s;"
         onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#ffffff'">PROUD MOMENT</a>
      <a href="about.html" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; transition: color 0.2s;"
         onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#ffffff'">ABOUT</a>
    </div>
  </nav>
`);

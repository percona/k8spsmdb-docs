document.addEventListener('DOMContentLoaded', function () {  
 var searchInput = document.querySelector('.md-search__input');  
 if (!searchInput || typeof posthog === 'undefined') return;

 // Auto-detect which product this is from the URL path  
 var path = window.location.pathname;  
 var product = path.startsWith('/pg-tde/') ? 'pg_tde'  
 : path.startsWith('/pg-stat-monitor/') ? 'pg-stat-monitor'  
 : 'postgresql';

 var debounceTimer;  
 searchInput.addEventListener('input', function () {  
 var query = this.value.trim();  
 if (query.length < 3) return; // skip very short strings

 clearTimeout(debounceTimer);  
 debounceTimer = setTimeout(function () {  
 posthog.capture('docs_search', {  
 query: query,  
 product: product,  
 $pathname: window.location.pathname,  
 $current_url: window.location.href  
 });  
 }, 600); // fire after user pauses typing for 600ms  
 });  
});  
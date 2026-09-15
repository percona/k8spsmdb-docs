document.addEventListener('DOMContentLoaded', function () {  
 var searchInput = document.querySelector('.md-search__input');  
 if (!searchInput || typeof posthog === 'undefined') return;

 // Auto-detect which operator product this is from the URL path  
 var path = window.location.pathname;  
 var product = path.startsWith('/percona-operator-for-postgresql/') ? 'operator-postgresql'  
 : path.startsWith('/percona-operator-for-mongodb/') ? 'operator-mongodb'  
 : path.startsWith('/percona-operator-for-xtradb-cluster/') ? 'operator-xtradb'  
 : path.startsWith('/percona-operator-for-mysql/') ? 'operator-mysql'  
 : null;

 // Only track if we're on a known operator doc site  
 if (!product) return;

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
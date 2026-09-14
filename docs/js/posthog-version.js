document.addEventListener('DOMContentLoaded', function () {  
 if (typeof posthog === 'undefined') return;

 var path = window.location.pathname;

 // Detect which operator this page belongs to  
 var operatorMatch = path.match(  
 /\/(percona-operator-for-([^\/]+))\//  
 );  
 var operatorSlug = operatorMatch ? operatorMatch[1] : null;  
 var operatorName = operatorMatch ? operatorMatch[2] : null;

 // Try to read the resolved version from the Material theme version selector  
 // This shows the REAL version even when the URL says /latest/  
 var versionEl = document.querySelector('.md-version__current');  
 var resolvedVersion = versionEl ? versionEl.textContent.trim() : null;

 // Fallback: extract version number directly from the URL when not /latest/  
 if (!resolvedVersion) {  
 var urlVersionMatch = path.match(  
 /\/percona-operator-for-[^\/]+\/(\d[\d.]*)\//  
 );  
 resolvedVersion = urlVersionMatch ? urlVersionMatch[1] : null;  
 }

 var isLatestAlias = path.includes('/latest/');

 posthog.register({  
 operator: operatorSlug, // e.g. "percona-operator-for-postgresql"  
 operator_name: operatorName, // e.g. "postgresql"  
 doc_version: resolvedVersion, // e.g. "3.0.0", "1.20.0", "2.4.0"  
 doc_version_via_latest: isLatestAlias // true when user hit /latest/ URL  
 });  
});  
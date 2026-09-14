document.addEventListener('DOMContentLoaded', function () {  
 if (typeof posthog === 'undefined') return;

 var path = window.location.pathname;

 // Detect which operator this page belongs to  
 var operatorMatch = path.match(  
 /\/(percona-operator-for-([^\/]+))\//  
 );

 // Exit early if we're not on an operator doc page  
 if (!operatorMatch) return;

 var operatorSlug = operatorMatch[1]; // e.g. "percona-operator-for-postgresql"  
 var operatorName = operatorMatch[2]; // e.g. "postgresql", "mongodb", "xtradb-cluster", "mysql"

 // Try to read the resolved version from the Material theme version selector.  
 // This shows the REAL version even when the URL says /latest/  
 var versionEl = document.querySelector('.md-version__current');  
 var resolvedVersion = versionEl ? versionEl.textContent.trim() : null;

 // Fallback: extract version number directly from the URL.  
 // Handles standard paths: /percona-operator-for-<name>/<version>/  
 // Also handles MySQL sub-product paths: /percona-operator-for-mysql/pxc/<version>/ or /ps/<version>/  
 if (!resolvedVersion) {  
 var urlVersionMatch = path.match(  
 /\/percona-operator-for-[^\/]+\/(?:pxc|ps)?\/?([\d][\d.]+)\//  
 );  
 resolvedVersion = urlVersionMatch ? urlVersionMatch[1] : null;  
 }

 var isLatestAlias = path.includes('/latest/');

 posthog.register({  
 operator: operatorSlug, // e.g. "percona-operator-for-postgresql"  
 operator_name: operatorName, // e.g. "postgresql", "mongodb", "xtradb-cluster", "mysql"  
 doc_version: resolvedVersion, // e.g. "3.0.0", "1.20.0"  
 doc_version_via_latest: isLatestAlias // true when user hit /latest/ URL  
 });  
});  
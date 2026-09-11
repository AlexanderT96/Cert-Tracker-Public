// Generic focused curriculum. No personal progress or automatic exam passes.
(function(global){
  'use strict';
  const groups=[
    ['Systems and physical-security foundations',['a-plus','network-plus','mcit','mcde','arcules-csp','mcie','acp'],'Windows, DNS, storage, recovery and IP-video integration'],
    ['Networking, wireless and programming foundations',['ccna','cwna','cisco-meraki-solutions','security-plus','pcep','az-900','pcap'],'Routing, switching, vendor-neutral enterprise Wi-Fi, Meraki operations, security fundamentals and reusable Python'],
    ['Linux, Windows Server, Azure and platform security',['linux-plus','az-802','az-104','az-700','sc-300','crowdstrike-ccfa','sc-500'],'Linux and Windows administration, Azure networking, identity and endpoint controls'],
    ['Professional networking and AI foundations',['ccnp-enterprise','ai-901'],'ENCOR + ENARSI routing depth; practical AI foundations'],
    ['Automation, AI applications and cloud design',['ai-103','pcpp1','az-305'],'Python applications, Microsoft Foundry and resilient Azure design'],
    ['Expert networking capstone',['ccie-enterprise'],'Expert practical networking; qualify and book only when ready']
  ];
  const ids=Object.freeze(groups.flatMap(g=>g[1]));
  const phases=Object.freeze(Object.fromEntries(groups.map(([title,certs,sub],i)=>[i+1,Object.freeze({title,name:title,sub,layer:sub,window:'Self-paced',certs:Object.freeze(certs),artifact:null,roles:null,applyOut:null})])));
  const additions=Object.freeze(['cwna','cisco-meraki-solutions']);
  const previousIds=Object.freeze(ids.filter(id=>!additions.includes(id)));
  const previousPaths=Object.freeze([previousIds,Object.freeze(previousIds.filter(id=>id!=='linux-plus')),Object.freeze(previousIds.filter(id=>!['linux-plus','az-700','az-802'].includes(id)))]);
  const focusTracks=Object.freeze([
    Object.freeze({id:'cwnp-wifi',title:'CWNP enterprise Wi-Fi depth',status:'OPTIONAL',why:'Use after CWNA when multi-vendor WLAN analysis, design or security is material. CWISA is shown only because current CWNE rules require it.',certs:Object.freeze(['cwap','cwdp','cwsp','cwisa','cwne']),resources:Object.freeze([{label:'CWNP certifications and study material',url:'https://www.cwnp.com/certifications/cwna'}])}),
    Object.freeze({id:'cellular-wan',title:'Enterprise cellular and 5G depth',status:'OPTIONAL',why:'Nokia Bell Labs provides the structured vendor-agnostic 5G ladder; five practical stages cover the enterprise-router, carrier, security and resilience work the exams do not.',certs:Object.freeze(['nokia-5g-associate','nokia-5g-networking','nokia-5g-slicing','nokia-5g-security','nokia-5g-cloud','nokia-5g-industrial']),topics:Object.freeze(['cellular-wan-operations','cellular-radio-diagnostics','cellular-carrier-core','cellular-security-resilience','cellular-architecture-capstone']),resources:Object.freeze([{label:'Nokia 5G certification portfolio',url:'https://www.nokia.com/networks/training/5g/'},{label:'Nokia Bell Labs 5G programme',url:'https://www.nokia.com/networks/training/bell-labs/'}])}),
    Object.freeze({id:'cloudflare',title:'Cloudflare edge and Zero Trust capability',status:'OPTIONAL',why:'High architecture and operational value for DNS, CDN/WAF/DDoS, tunnels and SASE; no verified public exam ladder, so evidence outranks badge claims.',certs:Object.freeze([]),topics:Object.freeze(['cloudflare-edge-foundations','cloudflare-zero-trust','cloudflare-architecture-capstone']),resources:Object.freeze([{label:'Cloudflare Learning Center',url:'https://www.cloudflare.com/learning/'},{label:'Cloudflare developer learning paths',url:'https://developers.cloudflare.com/learning-paths/'},{label:'Cloudflare Zero Trust documentation',url:'https://developers.cloudflare.com/cloudflare-one/'}])}),
    Object.freeze({id:'palo-alto',title:'Palo Alto network-security focus',status:'OPTIONAL',why:'Activate when PAN-OS, Prisma or a target vacancy creates vendor-specific return; keep architecture levels experience-gated.',certs:Object.freeze(['pan-practitioner','pan-netsec-pro','pan-ngfw-eng','pan-cloudsec-pro','pan-netsec-arch']),resources:Object.freeze([{label:'Palo Alto Networks certification programme',url:'https://www.paloaltonetworks.com/services/education/certification'},{label:'Beacon learning platform',url:'https://beacon.paloaltonetworks.com/'}])}),
  ]);
  const auditIds=Object.freeze([...new Set([...ids,...focusTracks.filter(x=>x.id.startsWith('cwnp-')).flatMap(x=>x.certs)])]);
  global.CERT_TRACKER_FOCUSED_ROUTE=Object.freeze({id:'network-platform-v4',title:'Network, wireless, cloud and automation engineering',ids,phases,focusTracks,auditIds,additions,previousIds,previousPaths});
  global.CERT_TRACKER_DEFAULT_PATH=ids;
  global.CERT_TRACKER_DEFAULT_ADDITIONS=Object.freeze([]);
})(window);

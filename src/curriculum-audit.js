// Cert Tracker — certification blueprint cross-walk and resource-validation ledger.
// VERIFIED means the recorded domains were checked against a public issuer blueprint.
// Resource validation is independent: a provider page is not automatically aligned material.
(function initCurriculumAudit(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT)throw new Error('config.js must load before curriculum-audit.js');
  const CHECKED='2026-09-11';
  const d=(subject,objective,weight=null)=>Object.freeze({subject,objective,weight:weight?Object.freeze(weight):null});
  const r=(label,url,role,status,note,free=null)=>Object.freeze({label,url,role,status,note,free,checkedAt:CHECKED});
  const verified=(version,url,domains,resources=[],note='Public issuer blueprint cross-walked to the tracker subjects.')=>Object.freeze({status:'VERIFIED',version,url,checkedAt:CHECKED,note,domains:Object.freeze(domains),resources:Object.freeze(resources)});
  const pending=(status,url,note)=>Object.freeze({status,version:null,url,checkedAt:null,note,domains:Object.freeze([]),resources:Object.freeze([])});

  const records={
    ccna:verified('200-301 v1.1','https://learningnetwork.cisco.com/s/ccna-exam-topics',[
      d('Network fundamentals','Network fundamentals',[20,20]),d('Network access: switching, VLANs and STP','Network access',[20,20]),d('IP connectivity: routing, OSPF and forwarding','IP connectivity',[25,25]),d('IP services','IP services',[10,10]),d('Security fundamentals','Security fundamentals',[15,15]),d('Automation and programmability','Automation and programmability',[10,10])
    ],[
      r('Cisco U. CCNA learning path','https://u.cisco.com/paths/implementing-administering-cisco-solutions-248','course','BLUEPRINT_ALIGNED','Linked by Cisco from the 200-301 exam page as its guided certification learning path.',null),
      r('Boson NetSim for CCNA','https://boson.com/netsim-cisco-network-simulator/','lab','VERSION_MATCH','Boson lists a 200-301 simulator; use it for applied configuration, not as the official blueprint.',false)
    ]),
    'az-900':verified('Skills measured from 20 July 2026','https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900',[
      d('Cloud concepts','Describe cloud concepts',[25,30]),d('Azure architecture and core services','Describe Azure architecture and services',[35,40]),d('Azure management and governance','Describe Azure management and governance',[30,35])
    ],[r('Microsoft Learn training','https://learn.microsoft.com/en-us/training/','course','ISSUER_RECOMMENDED','Official provider catalogue; select modules from the current AZ-900 credential page.',true)]),
    'az-104':verified('Skills measured from 17 April 2026','https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104',[
      d('Azure identities and governance','Manage Azure identities and governance',[20,25]),d('Storage','Implement and manage storage',[15,20]),d('Compute','Deploy and manage Azure compute resources',[20,25]),d('Virtual networking','Implement and manage virtual networking',[15,20]),d('Monitoring and maintenance','Monitor and maintain Azure resources',[10,15])
    ],[r('Microsoft Learn training','https://learn.microsoft.com/en-us/training/','course','ISSUER_RECOMMENDED','Official provider catalogue; select modules from the current AZ-104 credential page.',true)]),
    'az-700':verified('Skills measured from 27 July 2026','https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-700',[
      d('Core Azure networking infrastructure','Design and implement core networking infrastructure',[25,30]),d('Connectivity services','Design, implement and manage connectivity services',[20,25]),d('Application delivery services','Design and implement application delivery services',[15,20]),d('Private access to Azure services','Design and implement private access to Azure services',[10,15]),d('Azure network security services','Design and implement Azure network security services',[15,20])
    ],[r('Microsoft Learn training','https://learn.microsoft.com/en-us/training/','course','ISSUER_RECOMMENDED','Official provider catalogue; select modules from the current AZ-700 credential page.',true)]),
    'sc-300':verified('Skills measured from 27 April 2026','https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-300',[
      d('Identity lifecycle and Entra administration','Implement and manage user identities',[20,25]),d('Authentication and access management','Implement authentication and access management',[25,30]),d('Workload identities and applications','Plan and implement workload identities',[20,25]),d('Identity governance','Plan and automate identity governance',[20,25])
    ],[r('Microsoft Learn training','https://learn.microsoft.com/en-us/training/','course','ISSUER_RECOMMENDED','Official provider catalogue; select modules from the current SC-300 credential page.',true)]),
    'sc-500':verified('Current public skills measured','https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500',[
      d('Cloud identity and governance security','Manage identity, access and governance',[20,25]),d('Network, storage and database security','Secure storage, databases and networking',[25,30]),d('Compute and workload security','Secure compute',[20,25]),d('Security posture and Defender capabilities','Manage and monitor security posture',[20,25])
    ],[r('Microsoft SC-500 study guide','https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500','blueprint','BLUEPRINT','Authoritative skills-measured document; reference rather than teaching material.',true),r('Microsoft Learn training','https://learn.microsoft.com/en-us/training/','course','ISSUER_RECOMMENDED','Official provider catalogue; select modules from the current SC-500 credential page.',true)],'The previous separate AI subject was folded into Secure compute because the current issuer blueprint places AI security there.'),
    'az-305':verified('Skills measured from 17 April 2026','https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-305',[
      d('Identity, governance and monitoring design','Design identity, governance and monitoring solutions',[25,30]),d('Data storage architecture','Design data storage solutions',[20,25]),d('Business continuity and resilience','Design business continuity solutions',[15,20]),d('Infrastructure architecture','Design infrastructure solutions',[30,35])
    ],[r('Microsoft Learn training','https://learn.microsoft.com/en-us/training/','course','ISSUER_RECOMMENDED','Official provider catalogue; select modules from the current AZ-305 credential page.',true)]),
    pcep:verified('PCEP-30-02','https://pythoninstitute.org/pcep',[
      d('Python syntax, literals and operators','Computer programming fundamentals; Python syntax, semantics, literals, variables, operators and I/O'),d('Control flow','Conditions, loops and flow control'),d('Data collections','Lists, tuples, dictionaries and strings'),d('Functions and exceptions','Built-in and user-defined functions, scope, recursion and exception handling')
    ],[r('Python Essentials 1','https://edube.org/study/pe1','course','BLUEPRINT_ALIGNED','Free issuer-sponsored course explicitly aligned to active PCEP-30-02.',true)]),
    pcap:verified('PCAP-31-03','https://pythoninstitute.org/pcap',[
      d('Modules, packages and namespaces','Modules, packages, PIP and namespaces'),d('Strings and advanced data processing','Character encoding, strings and list processing'),d('Object-oriented programming','Classes, objects, inheritance, polymorphism and OOP modelling'),d('Exceptions, generators and file processing','Exceptions as objects, iterators, generators, closures, files and standard-library modules')
    ],[r('Python Essentials 2','https://edube.org/study/pe2','course','BLUEPRINT_ALIGNED','Free issuer-sponsored course explicitly aligned to active PCAP-31-03.',true)])
  };

  const queue={
    'a-plus':['SOURCE_IDENTIFIED','https://www.comptia.org/en-us/certifications/a/core-1-and-2-v15/','Obtain and inspect both current 220-1201 and 220-1202 objective documents.'],
    'network-plus':['SOURCE_IDENTIFIED','https://www.comptia.org/en-us/certifications/network/','Obtain and inspect the current N10-009 objective document.'],
    'security-plus':['SOURCE_IDENTIFIED','https://www.comptia.org/en-us/certifications/security/','Obtain and inspect the current SY0-701 objective document.'],
    'linux-plus':['SOURCE_IDENTIFIED','https://www.comptia.org/en-us/certifications/linux/','Obtain and inspect the current XK0-006 objective document.'],
    mcit:['ACCESS_RESTRICTED','https://www.milestonesys.com/learn-and-support/learning-and-performance/','Exact course objectives require Milestone Learning & Performance access.'],
    mcde:['ACCESS_RESTRICTED','https://www.milestonesys.com/learn-and-support/learning-and-performance/','Exact design-course objectives require Milestone Learning & Performance access.'],
    mcie:['ACCESS_RESTRICTED','https://www.milestonesys.com/learn-and-support/learning-and-performance/','Exact integration-engineer objectives require Milestone Learning & Performance access.'],
    acp:['ACCESS_RESTRICTED','https://www.axis.com/learning/certification-program','Validate the current exam specification and training modules through Axis learning access.'],
    'arcules-csp':['ACCESS_RESTRICTED','https://arcules.com/','Certification curriculum requires the partner learning portal.'],
    'az-802':['QUEUED','https://learn.microsoft.com/en-us/credentials/certifications/windows-server-administrator-associate/','Cross-walk the current transition-era study guide and confirm the complete award path.'],
    'crowdstrike-ccfa':['QUEUED','https://www.crowdstrike.com/content/dam/crowdstrike/marketing/en-us/documents/pdfs/crowdstrike-university/ccfa-certification-guide.pdf','Cross-walk the current official guide and validate partner-access training.'],
    'ccnp-enterprise':['QUEUED','https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccnp-enterprise/index.html','Cross-walk ENCOR and ENARSI as separate blueprints inside one milestone.'],
    'ai-901':['QUEUED','https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/','Cross-walk the current AI-901 study guide.'],
    'ai-103':['QUEUED','https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/','Cross-walk the current AI-103 study guide and release state.'],
    pcpp1:['QUEUED','https://pythoninstitute.org/pcpp1','Cross-walk the active syllabus and issuer-aligned advanced course.'],
    'ccie-enterprise':['QUEUED','https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccie-enterprise-infrastructure/index.html','Cross-walk qualifying exam and practical lab blueprints separately.']
  };
  for(const[id,[status,url,note]]of Object.entries(queue))records[id]=pending(status,url,note);
  const ROUTE_IMPACT=Object.freeze({'network-plus':49,'security-plus':42,'a-plus':36,'az-104':20,pcep:11,'az-900':11,pcap:11,'az-305':9,'linux-plus':8,'sc-300':8,mcie:6,acp:6,ccna:6,'crowdstrike-ccfa':6,pcpp1:6,mcde:4,mcit:3,'sc-500':3,'ccnp-enterprise':3,'az-802':2,'az-700':2,'ccie-enterprise':2,'arcules-csp':1,'ai-901':0,'ai-103':0});
  const frozen=Object.freeze(Object.fromEntries(Object.entries(records).map(([id,value])=>[id,Object.freeze({...value,certId:id,routeImpact:ROUTE_IMPACT[id]||0})])));
  function record(id){return frozen[id]||null;}
  function validatedResources(id){return Object.freeze((record(id)?.resources||[]).filter(x=>['BLUEPRINT_ALIGNED','VERSION_MATCH'].includes(x.status)));}
  function queueRows(){return Object.freeze(Object.values(frozen).filter(x=>x.status!=='VERIFIED').sort((a,b)=>b.routeImpact-a.routeImpact||a.certId.localeCompare(b.certId)));}
  function summary(){const rows=Object.values(frozen);return Object.freeze({scope:rows.length,verified:rows.filter(x=>x.status==='VERIFIED').length,queued:rows.filter(x=>x.status==='QUEUED'||x.status==='SOURCE_IDENTIFIED').length,restricted:rows.filter(x=>x.status==='ACCESS_RESTRICTED').length,validatedResources:rows.reduce((n,x)=>n+validatedResources(x.certId).length,0)});}
  CT.curriculumAudit=Object.freeze({STATUSES:Object.freeze(['VERIFIED','SOURCE_IDENTIFIED','ACCESS_RESTRICTED','QUEUED']),RESOURCE_STATUSES:Object.freeze(['BLUEPRINT','BLUEPRINT_ALIGNED','VERSION_MATCH','ISSUER_RECOMMENDED']),records:frozen,record,validatedResources,queue:queueRows,summary});
})(window);

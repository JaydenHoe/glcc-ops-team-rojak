-- ============================================================
-- Singapore localisation — in-place UPDATEs (no drop/reseed, keeps your data).
-- Companies → Pte Ltd, phones → +65, emails → .com.sg, projects → SG sites,
-- task amounts → S$. Currency formatting (S$) is handled in the app code.
-- ============================================================

update suppliers set company_name = 'Hua Yang Plumbing Supplies Pte Ltd', email = 'sales@huayang.com.sg',      phone = '+65 6745 4411' where id = 1;
update suppliers set company_name = 'Sani-Tech Trading Pte Ltd',          email = 'orders@sanitech.com.sg',    phone = '+65 6841 2200' where id = 2;
update suppliers set company_name = 'PipeMaster Industries Pte Ltd',      email = 'enquiry@pipemaster.com.sg', phone = '+65 6863 8899' where id = 3;
update suppliers set company_name = 'FlowPro Pumps & Valves Pte Ltd',     email = 'sales@flowpro.com.sg',      phone = '+65 6266 7766' where id = 4;
update suppliers set company_name = 'DrainPro Engineering Pte Ltd',       email = 'info@drainpro.com.sg',      phone = '+65 6755 5533' where id = 5;
update suppliers set company_name = 'BinaJaya Hardware Pte Ltd',          email = 'sales@binajaya.com.sg',     phone = '+65 6749 9090' where id = 6;
update suppliers set company_name = 'AquaFlow Distribution Pte Ltd',      email = 'sales@aquaflow.com.sg',     phone = '+65 6743 2211' where id = 7;

update projects set name = 'Bukit Timah Residences',        site_location = 'Bukit Timah, Singapore', client_name = 'Sunrise Development Pte Ltd' where id = 1;
update projects set name = 'Marina One Retail Fit-Out',     site_location = 'Marina Bay, Singapore',  client_name = 'Lendlease Singapore Pte Ltd' where id = 2;
update projects set name = 'Tuas Logistics Warehouse',      site_location = 'Tuas, Singapore',        client_name = 'Mapletree Logistics Pte Ltd' where id = 3;
update projects set name = 'Novena Medical Centre Upgrade', site_location = 'Novena, Singapore',      client_name = 'Healthway Medical Pte Ltd'   where id = 4;

update procurement_tasks set description = 'DrainPro quote S$12,350 awaiting PM approval'  where id = 2;
update procurement_tasks set description = 'FlowPro S$45,500 OVERDUE — release payment'    where id = 6;
update procurement_tasks set description = 'PipeMaster partial delivery invoice S$16,400'  where id = 7;

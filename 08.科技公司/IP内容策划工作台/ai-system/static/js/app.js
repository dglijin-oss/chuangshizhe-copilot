const API = '/api';

function setActiveNav(page) {
    const link = document.getElementById('nav-' + page);
    if (link) {
        link.classList.add('active');
    }
}

async function apiGet(path) {
    const resp = await fetch(API + path);
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    return resp.json();
}

async function apiPost(path, data) {
    const resp = await fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    return resp.json();
}

async function apiDelete(path) {
    const resp = await fetch(API + path, { method: 'DELETE' });
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    return resp.json();
}

async function apiPut(path) {
    const resp = await fetch(API + path, { method: 'PUT' });
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    return resp.json();
}

// Dashboard
async function loadDashboard() {
    try {
        const stats = await apiGet('/dashboard/stats');
        document.getElementById('stat-accounts').textContent = stats.active_accounts + '/' + stats.total_accounts;
        document.getElementById('stat-keywords').textContent = stats.active_keywords + '/' + stats.total_keywords;
        document.getElementById('stat-content').textContent = stats.total_content;
        document.getElementById('stat-today').textContent = stats.today_content;
        document.getElementById('stat-pending').textContent = stats.pending_tasks;
        document.getElementById('stat-running').textContent = stats.running_tasks;
        document.getElementById('stat-rewrites').textContent = stats.total_rewrites;

        const trending = await apiGet('/dashboard/trending');
        const container = document.getElementById('trending-list');
        if (trending.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-sm">暂无关键词</p>';
            return;
        }
        container.innerHTML = trending.map(kw => `
            <div class="flex justify-between items-center py-2 border-b last:border-0">
                <span class="font-medium">${kw.term}</span>
                <div class="flex items-center space-x-3 text-sm">
                    <span class="text-gray-500">${kw.category}</span>
                    <span class="px-2 py-0.5 rounded-full text-xs ${
                        kw.trend === 'up' ? 'bg-green-100 text-green-700' :
                        kw.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                    }">${kw.trend === 'up' ? '↑' : kw.trend === 'down' ? '↓' : '→'}</span>
                    <span class="font-semibold">${kw.heat_score}</span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Dashboard load failed:', e);
    }
}

// Accounts
async function loadAccounts() {
    try {
        const accounts = await apiGet('/accounts');
        const body = document.getElementById('accounts-body');
        if (accounts.length === 0) {
            body.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-gray-400">暂无账号，点击右上角添加</td></tr>';
            return;
        }
        body.innerHTML = accounts.map(acc => `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-2 px-3 capitalize">${acc.platform}</td>
                <td class="py-2 px-3 font-medium">${acc.account_name}</td>
                <td class="py-2 px-3">${acc.follower_count.toLocaleString()}</td>
                <td class="py-2 px-3">${acc.video_count}</td>
                <td class="py-2 px-3">
                    <span class="px-2 py-0.5 rounded-full text-xs ${acc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                        ${acc.is_active ? '活跃' : '停用'}
                    </span>
                </td>
                <td class="py-2 px-3 text-gray-500 text-xs">${acc.last_checked ? new Date(acc.last_checked).toLocaleString('zh-CN') : '未检查'}</td>
                <td class="py-2 px-3">
                    <button onclick="editAccount(${acc.id})" class="text-amber-600 hover:text-amber-800 text-xs mr-2">编辑</button>
                    <button onclick="checkAccount(${acc.id})" class="text-blue-600 hover:text-blue-800 text-xs mr-2">检查</button>
                    <button onclick="deleteAccount(${acc.id})" class="text-red-600 hover:text-red-800 text-xs">删除</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

function showAddAccount() {
    document.getElementById('add-form').classList.remove('hidden');
    document.getElementById('parsed-info').classList.add('hidden');
    document.getElementById('f-account-url').value = '';
    document.getElementById('info-name').value = '';
    document.getElementById('f-account-remark').value = '';
}
function hideAddAccount() { document.getElementById('add-form').classList.add('hidden'); }

// Auto-parse account URL to extract platform, account_id, name
let parsedAccountData = null;

function parseAccountUrl(url) {
    try {
        let u;
        try { u = new URL(url); } catch { return null; }

        // Bilibili space page: space.bilibili.com/{mid}
        if (u.hostname.includes('bilibili.com') && u.pathname.startsWith('/space/')) {
            const parts = u.pathname.split('/');
            const mid = parts[parts.indexOf('space') + 1];
            if (mid && /^\d+$/.test(mid)) {
                return { platform: 'bilibili', account_id: mid, account_url: url };
            }
        }

        // Bilibili user video page: space.bilibili.com/{mid}/video
        if (u.hostname.includes('bilibili.com') && u.pathname.startsWith('/')) {
            const parts = u.pathname.split('/').filter(Boolean);
            if (parts[0] === 'space' || parts.length === 1) {
                const mid = parts[0] === 'space' ? parts[1] : parts[0];
                if (mid && /^\d+$/.test(mid)) {
                    return { platform: 'bilibili', account_id: mid, account_url: url };
                }
            }
        }

        // Bilibili video page: www.bilibili.com/video/BVxxx -> extract author later
        if (u.hostname.includes('bilibili.com') && u.pathname.startsWith('/video/')) {
            return { platform: 'bilibili', account_id: '', account_url: url, note: '视频链接，无法直接提取账号ID' };
        }

        // WeChat video: channels.weixin.qq.com or similar
        if (u.hostname.includes('weixin.qq.com') || u.hostname.includes('channels')) {
            return { platform: 'wechat', account_id: '', account_url: url, note: '视频号需手动配置' };
        }

        return null;
    } catch {
        return null;
    }
}

function onUrlInput() {
    const url = document.getElementById('f-account-url').value;
    if (!url) {
        document.getElementById('parsed-info').classList.add('hidden');
        parsedAccountData = null;
        return;
    }

    const parsed = parseAccountUrl(url);
    const infoDiv = document.getElementById('parsed-info');

    if (!parsed) {
        infoDiv.classList.remove('hidden');
        infoDiv.className = 'bg-yellow-50 rounded-lg p-4 space-y-2';
        document.getElementById('info-platform').textContent = '未知平台';
        document.getElementById('info-id').textContent = '无法自动识别，请手动填写';
        document.getElementById('info-name').value = '';
        parsedAccountData = null;
        return;
    }

    parsedAccountData = parsed;
    infoDiv.className = 'bg-gray-50 rounded-lg p-4 space-y-2';
    infoDiv.classList.remove('hidden');

    const platformLabels = { bilibili: 'Bilibili', wechat: '微信视频号' };
    document.getElementById('info-platform').textContent = platformLabels[parsed.platform] || parsed.platform;
    document.getElementById('info-id').textContent = parsed.account_id || (parsed.note || '-');
    document.getElementById('info-name').value = '自动读取中...';

    // Auto-fetch account name from tikhub
    if (parsed.platform === 'bilibili' && parsed.account_id) {
        fetchAccountName(parsed.account_id);
    }
}

async function fetchAccountName(mid) {
    try {
        const resp = await fetch(`${TIKHUB_BASE_URL}/api/v1/bilibili/app/fetch_user_videos?user_id=${mid}&count=1&order=pubdate`, {
            headers: { 'Authorization': `Bearer ${TIKHUB_API_KEY}` }
        });
        const data = await resp.json();
        const items = data?.data?.data?.item || [];
        if (items.length > 0) {
            const name = items[0].author || '';
            if (name) {
                document.getElementById('info-name').value = name;
                parsedAccountData.account_name = name;
                return;
            }
        }
    } catch (e) {
        console.log('Failed to fetch account name:', e);
    }
    document.getElementById('info-name').value = '';
}

const TIKHUB_BASE_URL = 'https://api.tikhub.io';
const TIKHUB_API_KEY = 'kJsfWOdP2VWWqVWXOJKM5xXbbhC9RJl/4UjGrn2/f/2jlUyEfSG4dTKvNw==';

async function addAccount(e) {
    e.preventDefault();
    if (!parsedAccountData) {
        alert('请先粘贴有效的账号链接');
        return false;
    }
    const name = document.getElementById('info-name').value.trim();
    const remark = document.getElementById('f-account-remark').value.trim();
    try {
        await apiPost('/accounts', {
            platform: parsedAccountData.platform,
            account_id: parsedAccountData.account_id,
            account_name: name || '未知',
            account_remark: remark || null,
            account_url: parsedAccountData.account_url,
        });
        hideAddAccount();
        loadAccounts();
    } catch (e) { alert('添加失败: ' + e.message); }
    return false;
}

async function editAccount(id) {
    try {
        const accounts = await apiGet('/accounts');
        const acc = accounts.find(a => a.id === id);
        if (!acc) { alert('账号不存在'); return; }

        document.getElementById('e-account-id').value = id;
        document.getElementById('e-account-name').value = acc.account_name;
        document.getElementById('e-account-remark').value = acc.account_remark || '';
        document.getElementById('e-account-url').value = acc.account_url || '';
        document.getElementById('e-is-active').checked = acc.is_active;

        const modal = document.getElementById('edit-modal');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    } catch (e) { alert('加载失败: ' + e.message); }
}

function hideEditAccount() {
    const modal = document.getElementById('edit-modal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
}

function refreshAccountUrl() {
    const url = document.getElementById('e-account-url').value;
    if (!url) return;
    const parsed = parseAccountUrl(url);
    if (parsed) {
        // Just confirm parsing worked, user keeps the name as-is
        console.log('Parsed:', parsed.platform, parsed.account_id);
    }
}

async function updateAccount(e) {
    e.preventDefault();
    const id = document.getElementById('e-account-id').value;
    try {
        const data = {
            account_name: document.getElementById('e-account-name').value,
            account_remark: document.getElementById('e-account-remark').value || null,
            account_url: document.getElementById('e-account-url').value,
            is_active: document.getElementById('e-is-active').checked,
        };
        await fetch(`/api/accounts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => {
            if (!r.ok) throw new Error(`API error: ${r.status}`);
            return r.json();
        });
        hideEditAccount();
        loadAccounts();
    } catch (e) { alert('更新失败: ' + e.message); }
    return false;
}

async function checkAccount(id) {
    try {
        await apiPost(`/accounts/${id}/check`, {});
        alert('检查任务已启动');
    } catch (e) { alert('启动失败: ' + e.message); }
}

async function deleteAccount(id) {
    if (!confirm('确认删除此账号？')) return;
    try {
        await apiDelete(`/accounts/${id}`);
        loadAccounts();
    } catch (e) { alert('删除失败: ' + e.message); }
}

// Keywords
async function loadKeywords() {
    try {
        const keywords = await apiGet('/keywords');
        const body = document.getElementById('keywords-body');
        if (keywords.length === 0) {
            body.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-gray-400">暂无关键词</td></tr>';
            return;
        }
        body.innerHTML = keywords.map(kw => `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-2 px-3 font-medium">${kw.term}</td>
                <td class="py-2 px-3">${kw.platform}</td>
                <td class="py-2 px-3">${kw.category}</td>
                <td class="py-2 px-3">${kw.heat_score}</td>
                <td class="py-2 px-3">
                    <span class="px-2 py-0.5 rounded-full text-xs ${
                        kw.trend === 'up' ? 'bg-green-100 text-green-700' :
                        kw.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                    }">${kw.trend}</span>
                </td>
                <td class="py-2 px-3">
                    <button onclick="deleteKeyword(${kw.id})" class="text-red-600 hover:text-red-800 text-xs">删除</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

function showAddKeyword() { document.getElementById('add-form').classList.remove('hidden'); }
function hideAddKeyword() { document.getElementById('add-form').classList.add('hidden'); }

async function addKeyword(e) {
    e.preventDefault();
    try {
        await apiPost('/keywords', {
            term: document.getElementById('f-term').value,
            platform: document.getElementById('f-platform').value,
            category: document.getElementById('f-category').value,
        });
        hideAddKeyword();
        loadKeywords();
    } catch (e) { alert('添加失败: ' + e.message); }
    return false;
}

async function deleteKeyword(id) {
    if (!confirm('确认删除此关键词？')) return;
    try {
        await apiDelete(`/keywords/${id}`);
        loadKeywords();
    } catch (e) { alert('删除失败: ' + e.message); }
}

// Content
async function loadContentList() {
    try {
        let path = '/content?limit=50';
        const platform = document.getElementById('filter-platform').value;
        const processed = document.getElementById('filter-processed').value;
        if (platform) path += `&platform=${platform}`;
        if (processed) path += `&processed=${processed}`;

        const items = await apiGet(path);
        const container = document.getElementById('content-list');
        if (items.length === 0) {
            container.innerHTML = '<div class="card text-center text-gray-400 py-8">暂无采集内容</div>';
            return;
        }
        container.innerHTML = items.map(item => `
            <div class="card hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">${item.platform}</span>
                            <span class="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">${item.content_type}</span>
                            ${item.is_processed ? '<span class="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">已处理</span>' : ''}
                        </div>
                        <h3 class="font-medium text-gray-800">${item.title}</h3>
                        <p class="text-sm text-gray-500 mt-1 line-clamp-2">${item.description || ''}</p>
                        <div class="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span>播放 ${item.view_count}</span>
                            <span>点赞 ${item.like_count}</span>
                            <span>评论 ${item.comment_count}</span>
                        </div>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <a href="${item.url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs">查看</a>
                        <button onclick="rewriteContent(${item.id})" class="text-orange-600 hover:text-orange-800 text-xs">改写</button>
                        <button onclick="deleteContentItem(${item.id})" class="text-red-600 hover:text-red-800 text-xs">删除</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

async function rewriteContent(id) {
    try {
        const result = await apiPost('/rewrite', { content_id: id });
        alert('改写完成');
        window.location.href = '/rewrites';
    } catch (e) { alert('改写失败: ' + e.message); }
}

async function deleteContentItem(id) {
    if (!confirm('确认删除此内容？')) return;
    try {
        await apiDelete(`/content/${id}`);
        loadContentList();
    } catch (e) { alert('删除失败: ' + e.message); }
}

// Rewrites
async function loadRewrites() {
    try {
        let path = '/rewrites';
        const status = document.getElementById('filter-status').value;
        if (status) path += `?status=${status}`;

        const items = await apiGet(path);
        const container = document.getElementById('rewrites-list');
        if (items.length === 0) {
            container.innerHTML = '<div class="card text-center text-gray-400 py-8">暂无改写结果</div>';
            return;
        }
        container.innerHTML = items.map(item => `
            <div class="card hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <span class="px-2 py-0.5 rounded-full text-xs ${
                            item.status === 'approved' ? 'bg-green-100 text-green-700' :
                            item.status === 'published' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                        }">${item.status === 'draft' ? '草稿' : item.status === 'approved' ? '已审核' : '已发布'}</span>
                        <span class="ml-2 text-xs text-gray-400">${new Date(item.created_at).toLocaleString('zh-CN')}</span>
                    </div>
                    <div class="flex space-x-2">
                        ${item.status === 'draft' ? `<button onclick="updateRewriteStatus(${item.id}, 'approved')" class="text-green-600 hover:text-green-800 text-xs">审核通过</button>` : ''}
                        ${item.status === 'approved' ? `<button onclick="updateRewriteStatus(${item.id}, 'published')" class="text-blue-600 hover:text-blue-800 text-xs">标记发布</button>` : ''}
                    </div>
                </div>
                <h3 class="font-medium text-gray-800 mb-2">${item.title || '无标题'}</h3>
                <div class="text-sm text-gray-600 whitespace-pre-line">${item.rewritten_text}</div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

async function updateRewriteStatus(id, status) {
    try {
        await apiPut(`/rewrites/${id}?status=${status}`);
        loadRewrites();
    } catch (e) { alert('操作失败: ' + e.message); }
}

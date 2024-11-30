export default {
    async fetch(request: Request) {
        const url = new URL(request.url);
        const user = url.searchParams.get('user');

        if (!user) {
            return new Response(JSON.stringify({
                error: 'GitHub username is required'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const headers = {
            'Referer': `https://github.com/${user}`,
            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
            'X-Requested-With': 'XMLHttpRequest'
        };

        try {
            const response = await fetch(
                `https://github.com/${user}?action=show&controller=profiles&tab=contributions&user_id=${user}`,
                { headers }
            );
            const html = await response.text();

            // 解析贡献数据
            const dateRegex = /data-date="(.*?)" id="contribution-day-component/g;
            const dates = [...html.matchAll(dateRegex)].map(match => match[1]);
            const counts = [...html.matchAll(/(\d+) contribution|No contribution/g)]
                .map(match => match[0].startsWith('No') ? 0 : parseInt(match[1]));

            if (!dates.length || !counts.length) {
                return new Response(JSON.stringify({
                    total: 0,
                    contributions: []
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // 将数据按日期排序
            const contributionData = dates.map((date, index) => ({
                date,
                count: counts[index]
            })).sort((a, b) => a.date.localeCompare(b.date));

            // 计算总贡献
            const total = contributionData.reduce((sum, item) => sum + item.count, 0);

            // 将数据分组为每7天一组
            const groupedContributions: Array<Array<{ date: string; count: number }>> = [];
            for (let i = 0; i < contributionData.length; i += 7) {
                groupedContributions.push(contributionData.slice(i, i + 7));
            }

            return new Response(JSON.stringify({
                total,
                contributions: groupedContributions
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: 'Failed to fetch data'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};

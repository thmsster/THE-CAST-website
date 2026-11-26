document.addEventListener('DOMContentLoaded', () => {

    const copyItems = document.querySelectorAll('.copy-text');
    const toast = document.getElementById('copy-toast');

    let timer;

    copyItems.forEach(item => {

        item.addEventListener('click', async () => {

            try {

                await navigator.clipboard.writeText(item.dataset.copy);

                clearTimeout(timer);

                toast.classList.add('show');

                timer = setTimeout(() => {
                    toast.classList.remove('show');
                }, 1600);

            } catch (err) {

                console.error(err);

            }

        });

    });

});
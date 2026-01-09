        async function saveProject(data, userId, note) {
            // Save project
            const { data: project, error } = await window.supabase
                .from('projects')
                .insert([data])
                .select()
                .single();

            if (error) throw error;

            // If a payment was made (status is deposit_paid), log it in the payments table
            if (data.status === 'deposit_paid') {
                const budgetNum = parseFloat(data.budget.replace(/[^0-9.]/g, '')) || 0;
                const depositAmount = budgetNum * 0.5;
                
                const { error: paymentError } = await window.supabase
                    .from('payments')
                    .insert([{
                        project_id: project.id,
                        user_id: userId,
                        amount: depositAmount,
                        currency: 'GHS',
                        payment_reference: note.replace('Payment Ref: ', ''),
                        status: 'success',
                        payment_method: 'Paystack'
                    }]);
                
                if (paymentError) console.error('Error logging payment:', paymentError);
            }

            // Notification
            await window.supabase
                .from('notifications')
                .insert([{
                    user_id: userId,
                    type: 'project',
                    message: `New Project: ${data.title} (${data.status}) - ${note || ''}`
                }]);

            alert('Project submitted successfully!');
        }
